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

import { Devs } from "@utils/constants";
import definePlugin, { IconComponent } from "@utils/types";
import { React } from "@webpack/common";

import { ApertureLayer } from "./ApertureComponent";
import { useApertureStore } from "./store";

const ApertureIcon: IconComponent = ({ width = 24, height = 24, className }) => (
    <svg
        viewBox="0 0 24 24"
        width={width}
        height={height}
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
        <line x1="9.69" y1="8" x2="21.17" y2="8" />
        <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
        <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
        <line x1="14.31" y1="16" x2="2.83" y2="16" />
        <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
    </svg>
);

export default definePlugin({
    name: "Aperture",
    description: "Capture any message into a persistent floating 'portal' that stays on top of the UI.",
    authors: [Devs.nin0dev],

    flux: {
        MESSAGE_UPDATE: ({ message }) => {
            if (message.id && message.content) {
                useApertureStore.getState().updatePortalContent(message.id, message.content);
            }
        },
        MESSAGE_DELETE: ({ id }) => {
            // Optional: Should we close the portal if the message is deleted?
            // For now, let's keep it but maybe we could mark it as deleted.
        }
    },

    patches: [
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1$self.ApertureLayerWrapper(),"
            }
        }
    ],

    ApertureLayerWrapper() {
        return <ApertureLayer />;
    },

    messagePopoverButton: {
        icon: ApertureIcon,
        label: "Capture to Aperture",
        render(msg) {
            return {
                label: "Capture to Aperture",
                icon: ApertureIcon,
                message: msg,
                onClick: () => {
                    useApertureStore.getState().addPortal({
                        messageId: msg.id,
                        channelId: msg.channel_id,
                        content: msg.content,
                        author: {
                            username: msg.author.username,
                            globalName: msg.author.globalName,
                            avatar: msg.author.avatar
                        }
                    });
                }
            };
        }
    }
});
