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
import { Menu, Popout, React, useRef, useState } from "@webpack/common";
import type { PropsWithChildren } from "react";

import { StashPopout } from "./StashPopout";
import { addToStash, settings } from "./store";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function StashIcon({ isShown }: { isShown: boolean; }) {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="vc-stash-icon">
            <path
                fill="currentColor"
                d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5L7.5 9h9L12 14.5z"
            />
        </svg>
    );
}

function StashButton() {
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
            renderPopout={() => <StashPopout close={() => setShow(false)} />}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className="vc-stash-btn"
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "Stash"}
                    icon={() => <StashIcon isShown={isShown} />}
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
            id="add-to-stash"
            label="Add to Stash"
            action={() => {
                addToStash({
                    type: "text",
                    content: message.content,
                    author: message.author.username,
                    channelId: message.channel_id,
                    messageId: message.id
                });
            }}
        />
    );
};

const imageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    if (!props?.src) return;

    const group = findGroupChildrenByChildId("copy-native-link", children) ?? children;

    group.push(
        <Menu.MenuItem
            id="add-image-to-stash"
            label="Add Image to Stash"
            action={() => {
                addToStash({
                    type: "image",
                    content: props.src,
                    author: props.author?.username
                });
            }}
        />
    );
};

export default definePlugin({
    name: "Stash",
    description: "A temporary buffer for messages, links, and images. Access it from the header bar.",
    authors: [Devs.nin0.dev],
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

    TrailingWrapper({ children }: PropsWithChildren) {
        return (
            <>
                {children}
                <ErrorBoundary key="vc-stash" noop>
                    <StashButton />
                </ErrorBoundary>
            </>
        );
    },

    contextMenus: {
        "message": messageContextMenuPatch,
        "image-context": imageContextMenuPatch
    }
});
