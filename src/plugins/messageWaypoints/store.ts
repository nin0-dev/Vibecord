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

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export interface Waypoint {
    messageId: string;
    channelId: string;
    content: string;
    authorName: string;
    authorColor?: string;
    timestamp: number;
}

export const settings = definePluginSettings({
    waypoints: {
        type: OptionType.CUSTOM,
        default: {} as Record<string, Waypoint[]>,
        description: "Your saved waypoints per channel",
        restartNeeded: false,
        hidden: true
    }
});

export function toggleWaypoint(waypoint: Waypoint) {
    const { channelId, messageId } = waypoint;
    const currentWaypoints = settings.store.waypoints[channelId] || [];
    const index = currentWaypoints.findIndex(w => w.messageId === messageId);

    if (index > -1) {
        settings.store.waypoints[channelId] = currentWaypoints.filter(w => w.messageId !== messageId);
    } else {
        settings.store.waypoints[channelId] = [...currentWaypoints, waypoint].sort((a, b) => BigInt(a.messageId) < BigInt(b.messageId) ? -1 : 1);
    }

    // Force update the store by re-assigning
    settings.store.waypoints = { ...settings.store.waypoints };
}

export function isWaypoint(channelId: string, messageId: string) {
    return settings.store.waypoints[channelId]?.some(w => w.messageId === messageId) ?? false;
}
