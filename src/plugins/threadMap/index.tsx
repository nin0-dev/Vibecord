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

import { ThreadMap } from "./ThreadMap";

export const settings = definePluginSettings({
    showMentions: {
        type: OptionType.BOOLEAN,
        description: "Highlight mentions in the minimap",
        default: true
    },
    showOwnMessages: {
        type: OptionType.BOOLEAN,
        description: "Highlight your own messages in the minimap",
        default: true
    },
    minimapWidth: {
        type: OptionType.NUMBER,
        description: "Width of the minimap in pixels",
        default: 16,
        min: 8,
        max: 32
    }
});

export default definePlugin({
    name: "ThreadMap",
    description: "A visual minimap of the message history in the current channel. Jump to mentions, your own messages, and replies instantly.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1$self.ThreadMapWrapper(arguments[0]),"
            }
        }
    ],

    ThreadMapWrapper: ErrorBoundary.wrap((props: any) => {
        return <ThreadMap channelId={props.channel?.id} />;
    }, { noop: true })
});
