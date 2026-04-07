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

import { Flex } from "@components/Flex";
import { CopyIcon, DeleteIcon } from "@components/Icons";
import { copyWithToast, insertTextIntoChatInputBox } from "@utils/discord";
import { React, ScrollerThin, Text } from "@webpack/common";

import { clearStash, removeFromStash, settings, StashItem } from "./store";

export function StashPopout({ close }: { close: () => void; }) {
    const { items } = settings.use(["items"]);

    return (
        <div className="vc-stash-popout">
            <Flex flexDirection="row" justifyContent="space-between" alignItems="center" className="vc-stash-popout-header">
                <Text variant="heading-md/bold">Stash</Text>
                {items.length > 0 && (
                    <div className="vc-stash-clear-all" onClick={() => clearStash()}>
                        <DeleteIcon width={16} height={16} />
                        <Text variant="text-xs/medium">Clear All</Text>
                    </div>
                )}
            </Flex>
            <ScrollerThin className="vc-stash-list">
                {items.length === 0 ? (
                    <Flex justifyContent="center" alignItems="center" className="vc-stash-empty">
                        <Text variant="text-sm/medium" color="text-muted">Your stash is empty</Text>
                    </Flex>
                ) : (
                    items.map(item => (
                        <StashItemCard key={item.id} item={item} close={close} />
                    ))
                )}
            </ScrollerThin>
        </div>
    );
}

function StashItemCard({ item, close }: { item: StashItem; close: () => void; }) {
    const handleInsert = () => {
        insertTextIntoChatInputBox(item.content);
        close();
    };

    const handleCopy = () => {
        copyWithToast(item.content);
    };

    return (
        <div className="vc-stash-item">
            <Flex flexDirection="row" justifyContent="space-between" alignItems="center" className="vc-stash-item-info">
                <Text variant="text-xs/bold" color="header-secondary">
                    {item.author || "Unknown"}
                </Text>
                <Text variant="text-xxs/normal" color="text-muted">
                    {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
            </Flex>
            <div className="vc-stash-item-content" onClick={handleInsert}>
                {item.type === "image" ? (
                    <img src={item.content} className="vc-stash-item-image" />
                ) : (
                    <Text variant="text-sm/normal" className="vc-stash-item-text">
                        {item.content.length > 200 ? item.content.substring(0, 200) + "..." : item.content}
                    </Text>
                )}
            </div>
            <Flex flexDirection="row" gap="8px" className="vc-stash-item-actions">
                <div className="vc-stash-item-action" onClick={handleCopy} title="Copy">
                    <CopyIcon width={14} height={14} />
                </div>
                <div className="vc-stash-item-action" onClick={() => removeFromStash(item.id)} title="Remove">
                    <DeleteIcon width={14} height={14} />
                </div>
            </Flex>
        </div>
    );
}
