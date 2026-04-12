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

import { MessageActions, MessageStore, React, UserStore, useStateFromStores } from "@webpack/common";

import { settings } from "./index";

export function ThreadMap({ channelId }: { channelId: string; }) {
    const messages = useStateFromStores([MessageStore], () => {
        const msgs = MessageStore.getMessages(channelId);
        return msgs?.toArray ? msgs.toArray() : [];
    });
    const currentUser = useStateFromStores([UserStore], () => UserStore.getCurrentUser());

    if (!messages || !messages.length) return null;

    const firstMsgTimestamp = new Date(messages[0].timestamp as any).getTime();
    const lastMsgTimestamp = new Date(messages[messages.length - 1].timestamp as any).getTime();
    const duration = lastMsgTimestamp - firstMsgTimestamp || 1;

    const markers = messages.map((msg: any) => {
        const timestamp = new Date(msg.timestamp as any).getTime();
        const top = ((timestamp - firstMsgTimestamp) / duration) * 100;

        let type = "default";
        if (settings.store.showOwnMessages && msg.author?.id === currentUser?.id) {
            type = "own";
        } else if (settings.store.showMentions && msg.mentioned) {
            type = "mention";
        } else if (msg.messageReference) {
            type = "reply";
        }

        return {
            id: msg.id,
            top,
            type
        };
    });

    return (
        <div
            className="vc-threadmap-container"
            style={{ width: `${settings.store.minimapWidth}px` }}
        >
            {markers.map(marker => (
                <div
                    key={marker.id}
                    className={`vc-threadmap-marker vc-threadmap-marker-${marker.type}`}
                    style={{ top: `${marker.top}%` }}
                    onClick={() => {
                        MessageActions.jumpToMessage({
                            channelId,
                            messageId: marker.id,
                            flash: true
                        });
                    }}
                />
            ))}
        </div>
    );
}
