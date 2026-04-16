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

import { findGroupChildrenByChildId } from "@api/ContextMenu";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { Menu, Popout, React, useRef, useState } from "@webpack/common";
import type { PropsWithChildren } from "react";

import { addWaypoint, settings } from "./store";
import { TeleportPopout } from "./TeleportPopout";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function TeleportIcon() {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
            <line x1="12" y1="2" x2="12" y2="4"></line>
            <line x1="12" y1="20" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="4" y2="12"></line>
            <line x1="20" y1="12" x2="22" y2="12"></line>
        </svg>
    );
}

function TeleportButton() {
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
            renderPopout={() => <TeleportPopout close={() => setShow(false)} />}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className={`vc-teleport-btn ${isShown ? "selected" : ""}`}
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "Teleport"}
                    icon={TeleportIcon}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}

export default definePlugin({
    name: "Teleport",
    description: "Mark specific messages as waypoints and instantly jump back to them from any channel.",
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

    TrailingWrapper({ children }: PropsWithChildren) {
        return (
            <>
                {children}
                <ErrorBoundary key="vc-teleport" noop>
                    <TeleportButton />
                </ErrorBoundary>
            </>
        );
    },

    contextMenus: {
        "message-actions"(children, props: any) {
            const { message } = props;
            if (!message) return;

            const group = findGroupChildrenByChildId("copy-link", children);
            if (!group) return;

            group.push(
                <Menu.MenuItem
                    id="vc-teleport-set-waypoint"
                    label="Teleport: Set Waypoint"
                    action={() => {
                        addWaypoint({
                            channelId: message.channel_id,
                            messageId: message.id,
                            content: message.content,
                            author: message.author.globalName ?? message.author.username,
                            guildId: props.channel?.guild_id
                        });
                    }}
                    icon={TeleportIcon}
                />
            );
        }
    }
});
