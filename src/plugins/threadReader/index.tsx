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
import { Menu, MessageStore, Popout, React, useRef, useState } from "@webpack/common";
import type { PropsWithChildren } from "react";

import { useThreadStore } from "./store";
import { ThreadReaderPopout } from "./ThreadReader";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function BookIcon() {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
    );
}

function ThreadReaderButton() {
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
            renderPopout={() => <ThreadReaderPopout close={() => setShow(false)} />}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className={`vc-thread-reader-btn ${isShown ? "selected" : ""}`}
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "Thread Reader"}
                    icon={BookIcon}
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
            id="read-thread"
            label="Read Thread"
            action={() => {
                const chain: string[] = [];
                let current = message;

                // Trace up
                while (current) {
                    chain.unshift(current.id);
                    if (!current.messageReference?.message_id) break;
                    const nextId = current.messageReference.message_id;
                    current = MessageStore.getMessage(current.channel_id, nextId);
                }

                // Trace down
                const allMessages = MessageStore.getMessages(message.channel_id).toArray();
                let foundNew = true;
                const chainSet = new Set(chain);
                while (foundNew) {
                    foundNew = false;
                    for (const msg of allMessages) {
                        if (!chainSet.has(msg.id) && msg.messageReference?.message_id && chainSet.has(msg.messageReference.message_id)) {
                            chainSet.add(msg.id);
                            chain.push(msg.id);
                            foundNew = true;
                        }
                    }
                }

                // Sort chain by snowflake ID to ensure chronological order
                chain.sort((a, b) => BigInt(a) < BigInt(b) ? -1 : 1);

                useThreadStore.getState().setThread(message.channel_id, chain);
            }}
        />
    );
};

export default definePlugin({
    name: "ThreadReader",
    description: "Read conversation threads in a clean, focused view. Right-click a message to start reading.",
    authors: [Devs.nin0dev],

    patches: [
        {
            find: '?"BACK_FORWARD_NAVIGATION":',
            replacement: {
                match: /(?<=trailing:.{0,50})\i\.Fragment,(?=\{children:\[)/,
                replace: "$self.TrailingWrapper,"
            }
        }
    ],

    TrailingWrapper({ children }: PropsWithChildren) {
        return (
            <>
                {children}
                <ErrorBoundary key="vc-thread-reader" noop>
                    <ThreadReaderButton />
                </ErrorBoundary>
            </>
        );
    },

    contextMenus: {
        "message": messageContextMenuPatch
    }
});
