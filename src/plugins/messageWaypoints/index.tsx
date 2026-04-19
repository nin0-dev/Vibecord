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
import { GuildMemberStore, GuildRoleStore, Menu, React } from "@webpack/common";

import { isWaypoint, settings, toggleWaypoint } from "./store";
import { WaypointsGutter } from "./WaypointsGutter";

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const { message } = props;
    if (!message) return;

    const channelId = message.channel_id;
    const messageId = message.id;
    const active = isWaypoint(channelId, messageId);

    const group = findGroupChildrenByChildId("mark-unread", children) ?? children;

    group.push(
        <Menu.MenuItem
            id="toggle-waypoint"
            label={active ? "Remove Waypoint" : "Add Waypoint"}
            action={() => {
                let color: string | undefined;
                if (message.guild_id && message.author.id) {
                    const member = GuildMemberStore.getMember(message.guild_id, message.author.id);
                    if (member?.roles) {
                        const roles = member.roles
                            .map(id => GuildRoleStore.getRole(message.guild_id!, id))
                            .filter(Boolean)
                            .sort((a, b) => b!.position - a!.position);
                        color = roles.find(r => r!.colorString)?.colorString;
                    }
                }

                toggleWaypoint({
                    messageId,
                    channelId,
                    content: message.content,
                    authorName: message.author.globalName ?? message.author.username,
                    authorColor: color,
                    timestamp: Date.now()
                });
            }}
        />
    );
};

export default definePlugin({
    name: "MessageWaypoints",
    description: "Set personal waypoints on messages to easily jump back to important moments in a conversation.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1$self.WaypointsWrapper(arguments[0]),"
            }
        }
    ],

    WaypointsWrapper(props: any) {
        return (
            <ErrorBoundary noop>
                <WaypointsGutter channelId={props.channel?.id} />
            </ErrorBoundary>
        );
    },

    contextMenus: {
        "message": messageContextMenuPatch
    }
});
