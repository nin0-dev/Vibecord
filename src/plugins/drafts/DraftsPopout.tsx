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
import { DeleteIcon } from "@components/Icons";
import { findByProps } from "@webpack";
import {
    ChannelRouter,
    ChannelStore,
    DraftStore,
    DraftType,
    GuildStore,
    React,
    ScrollerThin,
    Text,
    useStateFromStores
} from "@webpack/common";

const DraftManager = findByPropsLazy("clearDraft", "saveDraft");

export function DraftsPopout({ close }: { close: () => void; }) {
    const drafts = useStateFromStores([DraftStore], () => {
        return DraftStore.getRecentlyEditedDrafts(DraftType.ChannelMessage)
            .filter(draft => draft.draft && draft.draft.trim().length > 0);
    });

    const clearAllDrafts = () => {
        if (!DraftManager) return;
        for (const draft of drafts) {
            DraftManager.clearDraft(draft.channelId, DraftType.ChannelMessage);
        }
    };

    return (
        <div className="vc-drafts-popout">
            <Flex flexDirection="row" justifyContent="space-between" alignItems="center" className="vc-drafts-popout-header">
                <Text variant="heading-md/bold">Drafts</Text>
                {drafts.length > 0 && (
                    <Flex
                        alignItems="center"
                        gap="4px"
                        style={{ cursor: "pointer" }}
                        onClick={clearAllDrafts}
                    >
                        <DeleteIcon width={14} height={14} />
                        <Text variant="text-xs/medium">Clear All</Text>
                    </Flex>
                )}
            </Flex>
            <ScrollerThin className="vc-drafts-list">
                {drafts.length === 0 ? (
                    <Flex justifyContent="center" alignItems="center" className="vc-drafts-empty">
                        <Text variant="text-sm/medium" color="text-muted">No drafts found</Text>
                    </Flex>
                ) : (
                    drafts.map(draft => (
                        <DraftItem key={draft.channelId} draft={draft} close={close} />
                    ))
                )}
            </ScrollerThin>
        </div>
    );
}

function DraftItem({ draft, close }: { draft: any; close: () => void; }) {
    const channel = useStateFromStores([ChannelStore], () => ChannelStore.getChannel(draft.channelId));
    const guild = useStateFromStores([GuildStore], () => channel ? GuildStore.getGuild(channel.guild_id) : null);

    const handleClick = () => {
        ChannelRouter.transitionToChannel(draft.channelId);
        close();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (DraftManager) {
            DraftManager.clearDraft(draft.channelId, DraftType.ChannelMessage);
        }
    };

    let channelName = draft.channelId;
    if (channel) {
        if (channel.name) {
            channelName = `#${channel.name}`;
        } else if (channel.rawRecipients) {
            channelName = channel.rawRecipients.map(u => u.username).join(", ");
        }
    }

    return (
        <div className="vc-drafts-item" onClick={handleClick}>
            <Flex flexDirection="row" justifyContent="space-between" alignItems="center" className="vc-drafts-item-info">
                <Text variant="text-xs/bold" color="header-secondary">
                    {guild ? `${guild.name} - ` : ""}{channelName}
                </Text>
                <Flex alignItems="center" gap="8px">
                    <Text variant="text-xxs/normal" color="text-muted">
                        {new Date(draft.timestamp).toLocaleTimeString()}
                    </Text>
                    <div onClick={handleDelete} title="Delete Draft" style={{ display: "flex", alignItems: "center" }}>
                        <DeleteIcon width={12} height={12} className="vc-drafts-delete-icon" />
                    </div>
                </Flex>
            </Flex>
            <Text variant="text-sm/normal" className="vc-drafts-item-text">
                {draft.draft}
            </Text>
        </div>
    );
}
