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
import { ChannelStore, GuildStore,MessageActions, React, ScrollerThin, SelectedChannelStore, Text } from "@webpack/common";

import { clearWaypoints,removeWaypoint, settings, Waypoint } from "./store";

export function TeleportPopout({ close }: { close: () => void; }) {
    const { waypoints } = settings.use(["waypoints"]);
    const currentChannelId = SelectedChannelStore.getChannelId();

    const filteredWaypoints = waypoints.filter(w => w.channelId === currentChannelId);
    const otherWaypoints = waypoints.filter(w => w.channelId !== currentChannelId);

    return (
        <div className="vc-teleport-popout">
            <Flex flexDirection="row" justifyContent="space-between" alignItems="center" className="vc-teleport-popout-header">
                <Text variant="heading-md/bold">Waypoints</Text>
                {waypoints.length > 0 && (
                    <div className="vc-teleport-clear-all" onClick={() => clearWaypoints()}>
                        <DeleteIcon width={16} height={16} />
                        <Text variant="text-xs/medium">Clear All</Text>
                    </div>
                )}
            </Flex>
            <ScrollerThin className="vc-teleport-list">
                {waypoints.length === 0 ? (
                    <Flex justifyContent="center" alignItems="center" className="vc-teleport-empty">
                        <Text variant="text-sm/medium" color="text-muted">No waypoints set. Right click a message to add one.</Text>
                    </Flex>
                ) : (
                    <>
                        {filteredWaypoints.length > 0 && (
                            <div className="vc-teleport-section">
                                <Text variant="text-xxs/bold" color="header-secondary" className="vc-teleport-section-title">CURRENT CHANNEL</Text>
                                {filteredWaypoints.map(w => <WaypointCard key={w.id} waypoint={w} close={close} />)}
                            </div>
                        )}
                        {otherWaypoints.length > 0 && (
                            <div className="vc-teleport-section">
                                <Text variant="text-xxs/bold" color="header-secondary" className="vc-teleport-section-title">OTHER CHANNELS</Text>
                                {otherWaypoints.map(w => <WaypointCard key={w.id} waypoint={w} close={close} />)}
                            </div>
                        )}
                    </>
                )}
            </ScrollerThin>
        </div>
    );
}

function WaypointCard({ waypoint, close }: { waypoint: Waypoint; close: () => void; }) {
    const handleJump = () => {
        MessageActions.jumpToMessage({
            channelId: waypoint.channelId,
            messageId: waypoint.messageId,
            flash: true,
            jumpType: "INSTANT"
        });
        close();
    };

    const channel = ChannelStore.getChannel(waypoint.channelId);
    const guild = waypoint.guildId ? GuildStore.getGuild(waypoint.guildId) : null;

    return (
        <div className="vc-teleport-item" onClick={handleJump}>
            <Flex flexDirection="row" justifyContent="space-between" alignItems="center" className="vc-teleport-item-info">
                <Text variant="text-xs/bold" color="header-primary" className="vc-teleport-item-author">
                    {waypoint.author}
                </Text>
                <Text variant="text-xxs/normal" color="text-muted">
                    {new Date(waypoint.timestamp).toLocaleString()}
                </Text>
            </Flex>
            {channel && (
                <Text variant="text-xxs/medium" color="text-muted" className="vc-teleport-item-location">
                    {guild ? `${guild.name} > ` : ""}#{channel.name}
                </Text>
            )}
            <div className="vc-teleport-item-content">
                <Text variant="text-sm/normal" className="vc-teleport-item-text">
                    {waypoint.content.length > 120 ? waypoint.content.substring(0, 120) + "..." : waypoint.content || "[Empty Message]"}
                </Text>
            </div>
            <div className="vc-teleport-item-remove" onClick={e => {
                e.stopPropagation();
                removeWaypoint(waypoint.id);
            }}>
                <DeleteIcon width={14} height={14} />
            </div>
        </div>
    );
}
