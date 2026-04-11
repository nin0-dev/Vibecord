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

export interface DraftSheet {
    id: string;
    title: string;
    content: string;
    updatedAt: number;
}

export const settings = definePluginSettings({
    sheets: {
        type: OptionType.CUSTOM,
        default: [
            {
                id: "default",
                title: "Draft 1",
                content: "",
                updatedAt: Date.now()
            }
        ] as DraftSheet[]
    },
    activeSheetId: {
        type: OptionType.STRING,
        description: "Active sheet ID",
        default: "default",
        hidden: true
    }
});

export function getActiveSheet(): DraftSheet {
    const { sheets } = settings.store;
    const activeId = settings.store.activeSheetId;
    return sheets.find(s => s.id === activeId) ?? sheets[0];
}

export function updateSheet(id: string, content: string) {
    settings.store.sheets = settings.store.sheets.map(s =>
        s.id === id ? { ...s, content, updatedAt: Date.now() } : s
    );
}

export function renameSheet(id: string, title: string) {
    settings.store.sheets = settings.store.sheets.map(s =>
        s.id === id ? { ...s, title } : s
    );
}

export function addSheet() {
    const id = Math.random().toString(36).substring(2, 11);
    const newSheet: DraftSheet = {
        id,
        title: `Draft ${settings.store.sheets.length + 1}`,
        content: "",
        updatedAt: Date.now()
    };
    settings.store.sheets = [...settings.store.sheets, newSheet];
    settings.store.activeSheetId = id;
}

export function deleteSheet(id: string) {
    if (settings.store.sheets.length <= 1) {
        updateSheet(id, "");
        return;
    }
    const newSheets = settings.store.sheets.filter(s => s.id !== id);
    settings.store.sheets = newSheets;
    if (settings.store.activeSheetId === id) {
        settings.store.activeSheetId = newSheets[0].id;
    }
}
