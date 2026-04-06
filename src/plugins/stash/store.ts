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

export interface StashItem {
    id: string;
    type: "text" | "image" | "link";
    content: string;
    author?: string;
    timestamp: number;
    channelId?: string;
    messageId?: string;
}

export const settings = definePluginSettings({
    items: {
        type: OptionType.CUSTOM,
        default: [] as StashItem[],
        hidden: true
    }
});

export function addToStash(item: Omit<StashItem, "id" | "timestamp">) {
    const newItem: StashItem = {
        ...item,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now()
    };
    settings.store.items = [newItem, ...settings.store.items].slice(0, 100);
}

export function removeFromStash(id: string) {
    settings.store.items = settings.store.items.filter(i => i.id !== id);
}

export function clearStash() {
    settings.store.items = [];
}
