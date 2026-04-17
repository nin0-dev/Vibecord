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

import { MirrorPanel } from "./MirrorPanel";
import { settings, toggleMirror, useMirrorStore } from "./store";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function MirrorIcon() {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
    );
}

function MirrorButton() {
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
            renderPopout={() => <MirrorPanel />}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className="vc-mirror-btn"
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "Mirror"}
                    icon={() => <MirrorIcon />}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}

const channelContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const channelId = props.channel?.id;
    if (!channelId) return;

    const isMirrored = settings.store.mirroredChannels.includes(channelId);

    const group = findGroupChildrenByChildId("copy-channel-id", children) ?? children;

    group.push(
        <Menu.MenuItem
            id="toggle-mirror"
            label={isMirrored ? "Stop Mirroring" : "Mirror Channel"}
            action={() => toggleMirror(channelId)}
        />
    );
};

export default definePlugin({
    name: "Mirror",
    description: "Keep an eye on multiple channels at once. Mirror messages from other channels in a side panel.",
    authors: [Devs.nin0dev],
    settings,

    flux: {
        MESSAGE_CREATE: ({ channelId, message }) => {
            if (settings.store.mirroredChannels.includes(channelId)) {
                useMirrorStore.getState().addMessage(channelId, {
                    id: message.id,
                    channelId: message.channel_id,
                    content: message.content,
                    author: {
                        id: message.author.id,
                        username: message.author.username,
                        globalName: message.author.globalName ?? message.author.global_name,
                        avatar: message.author.avatar
                    },
                    timestamp: message.timestamp
                });
            }
        },
        MESSAGE_DELETE: ({ channelId, id }) => {
            if (settings.store.mirroredChannels.includes(channelId)) {
                useMirrorStore.getState().removeMessage(channelId, id);
            }
        }
    },

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
                <ErrorBoundary key="vc-mirror" noop>
                    <MirrorButton />
                </ErrorBoundary>
            </>
        );
    },

    contextMenus: {
        "channel-context": channelContextMenuPatch
    }
});
