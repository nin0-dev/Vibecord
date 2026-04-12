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

interface PortalState {
    channelId: string | null;
    isVisible: boolean;
    x: number;
    y: number;
    setChannelId: (channelId: string | null) => void;
    setIsVisible: (isVisible: boolean) => void;
    setPosition: (x: number, y: number) => void;
    toggleVisible: () => void;
}

export const usePortalStore = zustandCreate(
    zustandPersist(
        (set: any, get: any) => ({
            channelId: null,
            isVisible: false,
            x: 100,
            y: 100,
            setChannelId: (channelId: string | null) => set({ channelId }),
            setIsVisible: (isVisible: boolean) => set({ isVisible }),
            setPosition: (x: number, y: number) => set({ x, y }),
            toggleVisible: () => set({ isVisible: !get().isVisible })
        }),
        {
            name: "vencord-portal-store"
        }
    )
);
