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

import { zustandCreate, zustandPersist } from "@webpack/common";

export interface Tether {
    id: string;
    channelId: string;
    guildId: string | undefined;
    author: string;
    content: string;
    isGlobal: boolean;
    timestamp: number;
}

interface TetherState {
    tethers: Tether[];
    tetherMessage: (message: any) => void;
    untetherMessage: (messageId: string) => void;
    toggleGlobal: (messageId: string) => void;
    clearTethers: () => void;
}

export const useTetherStore = zustandCreate(
    zustandPersist(
        (set: any) => ({
            tethers: [],
            tetherMessage: (message: any) => set((state: TetherState) => {
                if (state.tethers.some(t => t.id === message.id)) return state;
                const newTether: Tether = {
                    id: message.id,
                    channelId: message.channel_id,
                    guildId: message.guild_id,
                    author: message.author.username,
                    content: message.content,
                    isGlobal: false,
                    timestamp: Date.now()
                };
                return { tethers: [...state.tethers, newTether] };
            }),
            untetherMessage: (messageId: string) => set((state: TetherState) => ({
                tethers: state.tethers.filter(t => t.id !== messageId)
            })),
            toggleGlobal: (messageId: string) => set((state: TetherState) => ({
                tethers: state.tethers.map(t => t.id === messageId ? { ...t, isGlobal: !t.isGlobal } : t)
            })),
            clearTethers: () => set({ tethers: [] })
        }),
        {
            name: "VencordTetherStore"
        }
    )
);
