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

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { React } from "@webpack/common";

import { MessageMap } from "./MessageMap";

export const settings = definePluginSettings({
    showOwn: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Show markers for your own messages"
    },
    showMentions: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Show markers for mentions"
    },
    mapWidth: {
        type: OptionType.NUMBER,
        default: 12,
        description: "Width of the minimap (px)"
    }
});

export default definePlugin({
    name: "MessageMap",
    description: "A minimap for your messages. See mentions and your own messages at a glance.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1$self.renderMessageMap(),"
            }
        }
    ],

    renderMessageMap() {
        return (
            <ErrorBoundary noop>
                <MessageMap />
            </ErrorBoundary>
        );
    }
});
