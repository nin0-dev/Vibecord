/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Devs.nin0.dev and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ChannelRouter, Clickable, MessageActions, React, ScrollerThin, Text } from "@webpack/common";

import { clearAll, QuiltItem, removeItem, settings } from "./store";

function QuiltItemCard({ item, close }: { item: QuiltItem; close: () => void; }) {
    const handleClick = () => {
        if (item.type === "message" && item.messageId) {
            MessageActions.jumpToMessage({
                channelId: item.channelId,
                messageId: item.messageId,
                flash: true
            });
        } else {
            ChannelRouter.transitionToChannel(item.channelId);
        }
        close();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeItem(item.id);
    };

    return (
        <Clickable className="vc-quilt-item" onClick={handleClick}>
            <div className="vc-quilt-item-header">
                <div className="vc-quilt-item-author">
                    {item.authorName || "Unknown"}
                    {item.type === "channel" && <span className="vc-quilt-item-badge">Live</span>}
                </div>
                <div className="vc-quilt-item-origin">
                    {item.guildName ? `${item.guildName} > ` : ""}{item.channelName || "Channel"}
                </div>
            </div>
            <div className="vc-quilt-item-content">
                {item.content}
            </div>
            <div className="vc-quilt-item-actions">
                <Clickable onClick={handleDelete}>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="var(--interactive-normal)">
                        <path d="M18.41 5.83L17.17 4.59 12 9.76 6.83 4.59 5.59 5.83 10.76 11l-5.17 5.17 1.24 1.24 5.17-5.17 5.17 5.17 1.24-1.24-5.17-5.17 5.17-5.17z" />
                    </svg>
                </Clickable>
            </div>
        </Clickable>
    );
}

export function QuiltPopout({ close }: { close: () => void; }) {
    const { items } = settings.use();

    return (
        <div className="vc-quilt-popout">
            <div className="vc-quilt-header">
                <Text variant="heading-md/semibold" color="header-primary">Quilt</Text>
                {items.length > 0 && (
                    <Clickable onClick={clearAll}>
                        <Text variant="text-xs/medium" color="text-link">Clear All</Text>
                    </Clickable>
                )}
            </div>
            <ScrollerThin className="vc-quilt-items">
                {items.length === 0 ? (
                    <div className="vc-quilt-empty">
                        <Text variant="text-sm/normal">Your quilt is empty. Right-click a message or channel to add it here.</Text>
                    </div>
                ) : (
                    items.map(item => (
                        <QuiltItemCard key={item.id} item={item} close={close} />
                    ))
                )}
            </ScrollerThin>
        </div>
    );
}
