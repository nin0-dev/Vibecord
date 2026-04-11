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

import { zustandCreate } from "@webpack/common";

interface LoomState {
    highlightedIds: Set<string>;
    rootId: string | null;
    setHighlighted: (ids: Set<string>, rootId: string | null) => void;
    clearHighlighted: () => void;
}

export const useLoomStore = zustandCreate((set: any) => ({
    highlightedIds: new Set<string>(),
    rootId: null,
    setHighlighted: (highlightedIds: Set<string>, rootId: string | null) => set({ highlightedIds, rootId }),
    clearHighlighted: () => set({ highlightedIds: new Set(), rootId: null })
} as LoomState));
