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
import { sendMessage } from "@utils/discord";
import { OptionType } from "@utils/types";
import { SelectedChannelStore, zustandCreate } from "@webpack/common";

export interface MacroMessage {
    content: string;
    delay: number;
}

export interface Macro {
    id: string;
    name: string;
    messages: MacroMessage[];
}

export const settings = definePluginSettings({
    macros: {
        type: OptionType.CUSTOM,
        default: [] as Macro[],
        hidden: true
    }
});

interface MacroState {
    isRecording: boolean;
    recordingMacroName: string;
    recordedMessages: MacroMessage[];
    lastMessageTime: number;
    startRecording: (name: string) => void;
    stopRecording: () => void;
    addRecordedMessage: (content: string) => void;
}

export const useMacroState = (zustandCreate as any)((set, get) => ({
    isRecording: false,
    recordingMacroName: "",
    recordedMessages: [],
    lastMessageTime: 0,
    startRecording: name => set({
        isRecording: true,
        recordingMacroName: name,
        recordedMessages: [],
        lastMessageTime: Date.now()
    }),
    stopRecording: () => {
        const { recordingMacroName, recordedMessages } = get();
        if (recordedMessages.length > 0) {
            addMacro({
                name: recordingMacroName || `Macro ${new Date().toLocaleString()}`,
                messages: recordedMessages
            });
        }
        set({ isRecording: false, recordingMacroName: "", recordedMessages: [] });
    },
    addRecordedMessage: content => {
        const now = Date.now();
        const { lastMessageTime, recordedMessages } = get();
        const delay = recordedMessages.length === 0 ? 0 : now - lastMessageTime;
        set({
            recordedMessages: [...recordedMessages, { content, delay }],
            lastMessageTime: now
        });
    }
}));

export function addMacro(macro: Omit<Macro, "id">) {
    const newMacro: Macro = {
        ...macro,
        id: Math.random().toString(36).substring(2, 11)
    };
    settings.store.macros = [...settings.store.macros, newMacro];
}

export function deleteMacro(id: string) {
    settings.store.macros = settings.store.macros.filter(m => m.id !== id);
}

export function updateMacro(id: string, updates: Partial<Omit<Macro, "id">>) {
    settings.store.macros = settings.store.macros.map(m =>
        m.id === id ? { ...m, ...updates } : m
    );
}

export async function playMacro(macro: Macro) {
    const channelId = SelectedChannelStore.getChannelId();
    if (!channelId) return;

    for (const msg of macro.messages) {
        if (msg.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, msg.delay));
        }
        sendMessage(channelId, { content: msg.content });
    }
}
