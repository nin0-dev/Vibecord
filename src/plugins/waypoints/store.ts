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
    id: string;
    channelId: string;
    guildId: string | null;
    messageId: string;
    content: string;
    author: string;
    timestamp: number;
}

export const settings = definePluginSettings({
    waypoints: {
        type: OptionType.CUSTOM,
        default: [] as Waypoint[],
        hidden: true
    }
});

export function addWaypoint(waypoint: Omit<Waypoint, "id" | "timestamp">) {
    const newWaypoint: Waypoint = {
        ...waypoint,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now()
    };
    settings.store.waypoints = [newWaypoint, ...settings.store.waypoints];
}

export function removeWaypoint(id: string) {
    settings.store.waypoints = settings.store.waypoints.filter(w => w.id !== id);
}

export function clearWaypoints() {
    settings.store.waypoints = [];
}
