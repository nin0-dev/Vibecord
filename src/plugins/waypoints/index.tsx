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
import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Menu, React } from "@webpack/common";

import { WaypointsGutter } from "./WaypointsGutter";

export interface Waypoint {
    messageId: string;
    content: string;
    author: string;
    timestamp: string;
}

export const settings = definePluginSettings({
    waypoints: {
        type: OptionType.CUSTOM,
        default: {} as Record<string, Waypoint[]>,
        hidden: true
    },
    showMentions: {
        type: OptionType.BOOLEAN,
        description: "Show markers for mentions",
        default: true
    },
    showOwnMessages: {
        type: OptionType.BOOLEAN,
        description: "Show markers for your own messages",
        default: false
    }
});

function toggleWaypoint(channelId: string, message: any) {
    const current = settings.store.waypoints[channelId] || [];
    const index = current.findIndex(w => w.messageId === message.id);

    if (index > -1) {
        current.splice(index, 1);
    } else {
        current.push({
            messageId: message.id,
            content: message.content,
            author: message.author.username,
            timestamp: message.timestamp.toString()
        });
    }

    settings.store.waypoints = {
        ...settings.store.waypoints,
        [channelId]: [...current]
    };
}

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, { message }) => {
    if (!message) return;

    const waypoints = settings.store.waypoints[message.channel_id] || [];
    const isWaypoint = waypoints.some(w => w.messageId === message.id);

    const group = findGroupChildrenByChildId("copy-link", children) ?? children;

    group.push(
        <Menu.MenuItem
            id="toggle-waypoint"
            label={isWaypoint ? "Remove Waypoint" : "Add Waypoint"}
            action={() => toggleWaypoint(message.channel_id, message)}
        />
    );
};

export default definePlugin({
    name: "Waypoints",
    description: "Visual navigation gutter for messages. Mark waypoints, track mentions, and jump through channel history instantly.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1$self.GutterWrapper(arguments[0]),"
            }
        }
    ],

    GutterWrapper(props: any) {
        return (
            <ErrorBoundary noop>
                <WaypointsGutter channel={props.channel} />
            </ErrorBoundary>
        );
    },

    contextMenus: {
        "message": messageContextMenuPatch
    }
});
