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

export interface Portal {
    id: string;
    messageId: string;
    channelId: string;
    content: string;
    author: {
        username: string;
        globalName?: string;
        avatar?: string;
    };
    x: number;
    y: number;
}

interface ApertureState {
    portals: Portal[];
    addPortal: (portal: Omit<Portal, "id" | "x" | "y">) => void;
    removePortal: (id: string) => void;
    updatePortalPosition: (id: string, x: number, y: number) => void;
    updatePortalContent: (messageId: string, content: string) => void;
}

export const useApertureStore = zustandCreate(
    zustandPersist(
        (set: any) => ({
            portals: [],
            addPortal: (portalData: any) => set((state: ApertureState) => ({
                portals: [
                    ...state.portals,
                    {
                        ...portalData,
                        id: Math.random().toString(36).substring(2, 11),
                        x: 100 + state.portals.length * 20,
                        y: 100 + state.portals.length * 20
                    }
                ]
            })),
            removePortal: (id: string) => set((state: ApertureState) => ({
                portals: state.portals.filter(p => p.id !== id)
            })),
            updatePortalPosition: (id: string, x: number, y: number) => set((state: ApertureState) => ({
                portals: state.portals.map(p => p.id === id ? { ...p, x, y } : p)
            })),
            updatePortalContent: (messageId: string, content: string) => set((state: ApertureState) => ({
                portals: state.portals.map(p => p.messageId === messageId ? { ...p, content } : p)
            }))
        }),
        {
            name: "VencordAperture"
        }
    )
);
