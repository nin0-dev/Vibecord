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
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { DraftStore, DraftType, React, SelectedChannelStore, useStateFromStores } from "@webpack/common";

import managedStyle from "./style.css?managed";

const settings = definePluginSettings({
    threshold: {
        type: OptionType.NUMBER,
        default: 100,
        description: "Draft length threshold to activate Zen mode"
    },
    opacity: {
        type: OptionType.SLIDER,
        default: 0.1,
        description: "Opacity of faded elements",
        markers: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
        sticky: true
    },
    duration: {
        type: OptionType.NUMBER,
        default: 300,
        description: "Transition duration (ms)"
    },
    fadeGuilds: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Fade server list"
    },
    fadeSidebar: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Fade channel list"
    },
    fadeMembers: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Fade member list"
    },
    fadeHeader: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Fade header bar"
    }
});

function ZenManager() {
    const channelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getChannelId());
    const draft = useStateFromStores([DraftStore], () => DraftStore.getDraft(channelId, DraftType.ChannelMessage));
    const { threshold, opacity, duration, fadeGuilds, fadeSidebar, fadeMembers, fadeHeader } = settings.use();

    const isZen = draft?.length >= threshold;

    React.useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty("--vc-zen-opacity", String(opacity));
        root.style.setProperty("--vc-zen-duration", `${duration}ms`);
    }, [opacity, duration]);

    React.useEffect(() => {
        const classes = {
            "vc-zen-typing": isZen,
            "vc-zen-fade-guilds": fadeGuilds,
            "vc-zen-fade-sidebar": fadeSidebar,
            "vc-zen-fade-members": fadeMembers,
            "vc-zen-fade-header": fadeHeader
        };

        for (const [cls, value] of Object.entries(classes)) {
            if (value) document.body.classList.add(cls);
            else document.body.classList.remove(cls);
        }
    }, [isZen, fadeGuilds, fadeSidebar, fadeMembers, fadeHeader]);

    // Cleanup on unmount
    React.useEffect(() => () => {
        document.body.classList.remove(
            "vc-zen-typing",
            "vc-zen-fade-guilds",
            "vc-zen-fade-sidebar",
            "vc-zen-fade-members",
            "vc-zen-fade-header"
        );
        const root = document.documentElement;
        root.style.removeProperty("--vc-zen-opacity");
        root.style.removeProperty("--vc-zen-duration");
    }, []);

    return null;
}

export default definePlugin({
    name: "ZenTyping",
    description: "Automatically fades out distracting UI elements when you type long messages.",
    authors: [Devs.nin0dev],
    settings,
    managedStyle,

    patches: [
        {
            find: '?"BACK_FORWARD_NAVIGATION":',
            replacement: {
                match: /(?<=trailing:.{0,50})\i\.Fragment,(?=\{children:\[)/,
                replace: "$self.TrailingWrapper,"
            }
        }
    ],

    TrailingWrapper({ children }: { children: React.ReactNode; }) {
        return (
            <>
                {children}
                <ZenManager />
            </>
        );
    }
});
