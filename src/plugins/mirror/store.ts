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
import { MessageStore, zustandCreate } from "@webpack/common";

export interface MirroredMessage {
    id: string;
    channelId: string;
    content: string;
    author: {
        id: string;
        username: string;
        globalName?: string;
        avatar?: string;
    };
    timestamp: string;
}

export const settings = definePluginSettings({
    mirroredChannels: {
        type: OptionType.CUSTOM,
        default: [] as string[],
        hidden: true
    }
});

interface MirrorState {
    messages: Record<string, MirroredMessage[]>;
    addMessage: (channelId: string, message: MirroredMessage) => void;
    removeMessage: (channelId: string, messageId: string) => void;
    clearMessages: (channelId: string) => void;
}

export const useMirrorStore = zustandCreate((set: any) => ({
    messages: {},
    addMessage: (channelId: string, message: MirroredMessage) => set((state: MirrorState) => {
        const currentMessages = state.messages[channelId] || [];
        // Only keep last 5 messages
        const updatedMessages = [message, ...currentMessages.filter(m => m.id !== message.id)].slice(0, 5);
        return {
            messages: {
                ...state.messages,
                [channelId]: updatedMessages
            }
        };
    }),
    removeMessage: (channelId: string, messageId: string) => set((state: MirrorState) => {
        const currentMessages = state.messages[channelId] || [];
        return {
            messages: {
                ...state.messages,
                [channelId]: currentMessages.filter(m => m.id !== messageId)
            }
        };
    }),
    clearMessages: (channelId: string) => set((state: MirrorState) => {
        const newMessages = { ...state.messages };
        delete newMessages[channelId];
        return { messages: newMessages };
    })
} as MirrorState));

export function toggleMirror(channelId: string) {
    const isMirrored = settings.store.mirroredChannels.includes(channelId);
    if (isMirrored) {
        settings.store.mirroredChannels = settings.store.mirroredChannels.filter(id => id !== channelId);
        useMirrorStore.getState().clearMessages(channelId);
    } else {
        settings.store.mirroredChannels = [...settings.store.mirroredChannels, channelId];
        // Populate with recent messages if available
        const cached = MessageStore.getMessages(channelId);
        if (cached) {
            // cached.toArray() is oldest first.
            // addMessage prepends, so we iterate oldest to newest to end up with [Newest, ..., Oldest]
            cached.toArray().slice(-5).forEach((msg: any) => {
                useMirrorStore.getState().addMessage(channelId, {
                    id: msg.id,
                    channelId: msg.channel_id,
                    content: msg.content,
                    author: {
                        id: msg.author.id,
                        username: msg.author.username,
                        globalName: msg.author.globalName ?? msg.author.global_name,
                        avatar: msg.author.avatar
                    },
                    timestamp: msg.timestamp
                });
            });
        }
    }
}
