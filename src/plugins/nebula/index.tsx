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

import { Nebula } from "./Nebula";

export const settings = definePluginSettings({
    width: {
        type: OptionType.NUMBER,
        description: "The width of the Nebula minimap in pixels",
        default: 60
    },
    position: {
        type: OptionType.SELECT,
        description: "Which side to show the minimap on",
        options: [
            { label: "Right", value: "right", default: true },
            { label: "Left", value: "left" }
        ]
    },
    showMedia: {
        type: OptionType.BOOLEAN,
        description: "Highlight messages with media/attachments",
        default: true
    }
});

export default definePlugin({
    name: "Nebula",
    description: "A cosmic minimap for your chat. Visualize message density, mentions, and media across the entire channel history.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1$self.NebulaWrapper(arguments[0]),"
            }
        }
    ],

    NebulaWrapper(props: any) {
        return (
            <ErrorBoundary noop>
                <Nebula channelId={props.channel?.id} />
            </ErrorBoundary>
        );
    }
});
