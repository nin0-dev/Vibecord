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

export interface ChannelHistoryItem {
    id: string;
    timestamp: number;
}

export interface MessageHistoryItem {
    id: string;
    channelId: string;
    content: string;
    author: string;
    timestamp: number;
}

export interface InteractionHistoryItem {
    id: string;
    channelId: string;
    messageId?: string;
    type: "reaction" | "call" | "mention";
    details: string;
    timestamp: number;
}

export const settings = definePluginSettings({
    channels: {
        type: OptionType.CUSTOM,
        default: [] as ChannelHistoryItem[],
        hidden: true
    },
    messages: {
        type: OptionType.CUSTOM,
        default: [] as MessageHistoryItem[],
        hidden: true
    },
    interactions: {
        type: OptionType.CUSTOM,
        default: [] as InteractionHistoryItem[],
        hidden: true
    },
    historyLimit: {
        type: OptionType.NUMBER,
        description: "Number of items to keep in each history category",
        default: 20
    }
});

function prune(list: any[]) {
    return list.slice(0, settings.store.historyLimit);
}

export function addChannelToHistory(channelId: string) {
    const newItem: ChannelHistoryItem = {
        id: channelId,
        timestamp: Date.now()
    };
    const filtered = settings.store.channels.filter(c => c.id !== channelId);
    settings.store.channels = prune([newItem, ...filtered]);
}

export function addMessageToHistory(message: Omit<MessageHistoryItem, "timestamp">) {
    const newItem: MessageHistoryItem = {
        ...message,
        timestamp: Date.now()
    };
    settings.store.messages = prune([newItem, ...settings.store.messages]);
}

export function addInteractionToHistory(interaction: Omit<InteractionHistoryItem, "id" | "timestamp">) {
    const newItem: InteractionHistoryItem = {
        ...interaction,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now()
    };
    settings.store.interactions = prune([newItem, ...settings.store.interactions]);
}

export function clearHistory(type: "channels" | "messages" | "interactions") {
    settings.store[type] = [];
}
