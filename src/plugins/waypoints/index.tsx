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
import { Menu, React } from "@webpack/common";
import type { PropsWithChildren } from "react";

import { WaypointButton } from "./components";
import { addWaypoint, settings } from "./store";

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const { message, channel } = props;
    if (!message || !channel) return;

    const group = findGroupChildrenByChildId("copy-link", children) ?? children;

    group.push(
        <Menu.MenuItem
            id="add-waypoint"
            label="Add Waypoint"
            action={() => {
                addWaypoint({
                    channelId: channel.id,
                    guildId: channel.guild_id,
                    messageId: message.id,
                    content: message.content,
                    author: message.author.username
                });
            }}
        />
    );
};

export default definePlugin({
    name: "Waypoints",
    description: "Mark messages and jump back to them easily from the header bar.",
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
                <ErrorBoundary key="vc-waypoints" noop>
                    <WaypointButton />
                </ErrorBoundary>
            </>
        );
    },

    contextMenus: {
        "message": messageContextMenuPatch
    }
});
