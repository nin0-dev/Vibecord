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

export interface BreadcrumbEntry {
    channelId: string;
    timestamp: number;
}

export const settings = definePluginSettings({
    history: {
        type: OptionType.CUSTOM,
        default: [] as BreadcrumbEntry[],
        hidden: true
    },
    maxEntries: {
        type: OptionType.NUMBER,
        description: "Maximum number of breadcrumbs to display",
        default: 5,
        min: 1,
        max: 10,
        restartNeeded: false
    }
});

export function pushToHistory(channelId: string) {
    const history = [...settings.store.history];
    const existingIndex = history.findIndex(entry => entry.channelId === channelId);

    // If it's already the most recent, do nothing
    if (existingIndex === 0) return;

    // Remove existing entry if it exists
    if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
    }

    // Add to the front
    history.unshift({
        channelId,
        timestamp: Date.now()
    });

    // Limit size. We keep maxEntries + 1 items in history because
    // we always slice(1) in the UI to skip the current channel.
    settings.store.history = history.slice(0, settings.store.maxEntries + 1);
}

export function clearHistory() {
    settings.store.history = [];
}
