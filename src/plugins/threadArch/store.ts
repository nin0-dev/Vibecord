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

interface ThreadArchState {
    hoveredMessageId: string | null;
    parentMessageId: string | null;
    setHovered: (id: string | null, parentId: string | null) => void;
    clearHovered: () => void;
}

export const useThreadArchStore = zustandCreate((set: any) => ({
    hoveredMessageId: null,
    parentMessageId: null,
    setHovered: (hoveredMessageId: string | null, parentMessageId: string | null) => set({ hoveredMessageId, parentMessageId }),
    clearHovered: () => set({ hoveredMessageId: null, parentMessageId: null })
} as ThreadArchState));
