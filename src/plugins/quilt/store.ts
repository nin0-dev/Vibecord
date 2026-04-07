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

export interface QuiltItem {
    id: string;
    type: "message" | "channel";
    content: string;
    authorName?: string;
    authorId?: string;
    authorAvatar?: string;
    channelId: string;
    messageId?: string;
    guildId?: string;
    guildName?: string;
    channelName?: string;
    timestamp: number;
}

export const settings = definePluginSettings({
    items: {
        type: OptionType.CUSTOM,
        default: [] as QuiltItem[],
        hidden: true
    },
    maxItems: {
        type: OptionType.NUMBER,
        description: "Maximum number of items in the Quilt",
        default: 50
    }
});

export function addItem(item: Omit<QuiltItem, "timestamp">) {
    const newItem: QuiltItem = {
        ...item,
        timestamp: Date.now()
    };

    // Remove if already exists (to update position/content)
    const filtered = settings.store.items.filter(i => i.id !== newItem.id);
    settings.store.items = [newItem, ...filtered].slice(0, settings.store.maxItems);
}

export function updateItemContent(id: string, content: string, authorName?: string, authorId?: string, authorAvatar?: string) {
    const items = [...settings.store.items];
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
        items[index] = {
            ...items[index],
            content,
            authorName: authorName ?? items[index].authorName,
            authorId: authorId ?? items[index].authorId,
            authorAvatar: authorAvatar ?? items[index].authorAvatar,
            timestamp: Date.now()
        };
        settings.store.items = items;
    }
}

export function removeItem(id: string) {
    settings.store.items = settings.store.items.filter(i => i.id !== id);
}

export function clearAll() {
    settings.store.items = [];
}
