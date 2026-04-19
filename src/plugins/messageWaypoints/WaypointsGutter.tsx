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
import { MessageActions, React, Text, Tooltip } from "@webpack/common";

import { settings, Waypoint } from "./store";

export function WaypointsGutter({ channelId }: { channelId: string; }) {
    if (!channelId) return null;

    const { waypoints: allWaypoints } = settings.use(["waypoints"]);
    const waypoints = allWaypoints[channelId] || [];

    if (waypoints.length === 0) return null;

    return (
        <div className="vc-waypoints-gutter">
            {waypoints.map(waypoint => (
                <WaypointMarker key={waypoint.messageId} waypoint={waypoint} />
            ))}
        </div>
    );
}

function WaypointMarker({ waypoint }: { waypoint: Waypoint; }) {
    const handleJump = () => {
        MessageActions.jumpToMessage({
            channelId: waypoint.channelId,
            messageId: waypoint.messageId,
            flash: true
        });
    };

    const tooltipContent = (
        <div className="vc-waypoint-tooltip">
            <Flex flexDirection="row" alignItems="center" gap={8}>
                <Text
                    variant="text-sm/bold"
                    style={{ color: waypoint.authorColor || "var(--header-primary)" }}
                >
                    {waypoint.authorName}
                </Text>
                <Text variant="text-xs/normal" color="text-muted">
                    {new Date(waypoint.timestamp).toLocaleString()}
                </Text>
            </Flex>
            <Text
                variant="text-sm/normal"
                color="text-normal"
                className="vc-waypoint-preview"
            >
                {waypoint.content || "(No content)"}
            </Text>
        </div>
    );

    return (
        <Tooltip text={tooltipContent} position="left">
            {props => (
                <div
                    {...props}
                    className="vc-waypoint-marker"
                    onClick={handleJump}
                    style={{
                        backgroundColor: waypoint.authorColor || "var(--brand-experiment)"
                    } as React.CSSProperties}
                />
            )}
        </Tooltip>
    );
}
