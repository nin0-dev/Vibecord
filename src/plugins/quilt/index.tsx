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

import "./style.css";

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { ChannelStore, FluxDispatcher, GuildStore, Menu, MessageStore, Popout, React, useRef, useState } from "@webpack/common";
import type { PropsWithChildren } from "react";

import { QuiltPopout } from "./QuiltPopout";
import { addItem, settings, updateItemContent } from "./store";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function QuiltIcon({ isShown }: { isShown: boolean; }) {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="vc-quilt-icon">
            <path
                fill="currentColor"
                d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v8H8V8z"
            />
        </svg>
    );
}

function QuiltButton() {
    const buttonRef = useRef(null);
    const [show, setShow] = useState(false);

    return (
        <Popout
            position="bottom"
            align="right"
            animation={Popout.Animation.NONE}
            shouldShow={show}
            onRequestClose={() => setShow(false)}
            targetElementRef={buttonRef}
            renderPopout={() => <QuiltPopout close={() => setShow(false)} />}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className="vc-quilt-btn"
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "Quilt"}
                    icon={() => <QuiltIcon isShown={isShown} />}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const { message } = props;
    if (!message) return;

    const group = findGroupChildrenByChildId("copy-link", children) ?? children;

    group.push(
        <Menu.MenuItem
            id="add-to-quilt"
            label="Add to Quilt"
            action={() => {
                const channel = ChannelStore.getChannel(message.channel_id);
                const guild = channel?.guild_id ? GuildStore.getGuild(channel.guild_id) : null;

                addItem({
                    id: message.id,
                    type: "message",
                    content: message.content,
                    authorName: message.author.username,
                    authorId: message.author.id,
                    authorAvatar: message.author.avatar,
                    channelId: message.channel_id,
                    messageId: message.id,
                    guildId: guild?.id,
                    guildName: guild?.name,
                    channelName: channel?.name
                });
            }}
        />
    );
};

const channelContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const { channel } = props;
    if (!channel) return;

    const group = findGroupChildrenByChildId("mark-channel-read", children) ?? children;

    group.push(
        <Menu.MenuItem
            id="quilt-channel"
            label="Quilt Channel"
            action={() => {
                const guild = channel.guild_id ? GuildStore.getGuild(channel.guild_id) : null;
                const lastMessage = MessageStore.getMessages(channel.id).last();

                addItem({
                    id: channel.id,
                    type: "channel",
                    content: lastMessage?.content || "No recent messages",
                    authorName: lastMessage?.author?.username,
                    authorId: lastMessage?.author?.id,
                    authorAvatar: lastMessage?.author?.avatar,
                    channelId: channel.id,
                    guildId: guild?.id,
                    guildName: guild?.name,
                    channelName: channel.name
                });
            }}
        />
    );
};

function handleMessageCreate({ channelId, message }: { channelId: string; message: any; }) {
    const quiltedItems = settings.store.items;
    const item = quiltedItems.find(i => i.id === channelId && i.type === "channel");

    if (item) {
        updateItemContent(
            channelId,
            message.content,
            message.author?.username,
            message.author?.id,
            message.author?.avatar
        );
    }
}

export default definePlugin({
    name: "Quilt",
    description: "Pin messages and live channels to a unified dashboard in the header bar.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: '?"BACK_FORWARD_NAVIGATION":',
            replacement: {
                match: /(?<=trailing:.{0,50})\i\.Fragment,(?=\{children:\[)/,
                replace: "$self.TrailingWrapper,"
            }
        }
    ],

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", handleMessageCreate);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", handleMessageCreate);
    },

    TrailingWrapper({ children }: PropsWithChildren) {
        return (
            <>
                {children}
                <ErrorBoundary key="vc-quilt" noop>
                    <QuiltButton />
                </ErrorBoundary>
            </>
        );
    },

    contextMenus: {
        "message": messageContextMenuPatch,
        "channel-context": channelContextMenuPatch,
        "guild-context": (children, { guild }) => {
            // Optional: could add "Quilt all channels" or something similar if needed
        }
    }
});
