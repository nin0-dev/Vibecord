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
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findCssClassesLazy } from "@webpack";
import { React } from "@webpack/common";

import { Minimap } from "./Minimap";

const settings = definePluginSettings({
    width: {
        type: OptionType.NUMBER,
        description: "The width of the minimap in pixels",
        default: 40,
    },
    position: {
        type: OptionType.SELECT,
        description: "Position of the minimap",
        default: "right",
        options: [
            { label: "Left", value: "left" },
            { label: "Right", value: "right" }
        ]
    },
    ownMessageColor: {
        type: OptionType.STRING,
        description: "Color for your own messages (CSS color)",
        default: "var(--brand-experiment)"
    },
    mentionColor: {
        type: OptionType.STRING,
        description: "Color for mentions (CSS color)",
        default: "var(--status-warning)"
    }
});

const MessagesClasses = findCssClassesLazy("messagesWrapper", "scroller");

function MinimapWrapper({ channelId }: { channelId: string; }) {
    const scrollerRef = React.useRef<HTMLDivElement>(null);
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

    React.useEffect(() => {
        const { messagesWrapper, scroller } = MessagesClasses;
        const wrapper = document.querySelector(`.${messagesWrapper}`);
        if (wrapper) {
            const scrollerEl = wrapper.querySelector(`.${scroller}`) as HTMLDivElement;
            if (scrollerEl) {
                // @ts-ignore
                scrollerRef.current = scrollerEl;
                forceUpdate();
            }
        }
    }, [channelId]);

    if (!scrollerRef.current) return null;

    return (
        <Minimap
            channelId={channelId}
            scrollerRef={scrollerRef}
            settings={settings.store}
        />
    );
}

export default definePlugin({
    name: "ChatMinimap",
    description: "A VS Code-like minimap for chat history, allowing quick navigation and visual overview of mentions and activity.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: (m, childrenStart) => {
                    const minimap = "<ErrorBoundary noop>$self.renderMinimap(arguments[0])</ErrorBoundary>";
                    if (settings.store.position === "left") {
                        return `${childrenStart}${minimap},`;
                    } else {
                        return `${childrenStart}`;
                    }
                }
            }
        },
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(?<=children:\[.+?)(?=\])/,
                replace: m => {
                    if (settings.store.position === "right") {
                        return ",<ErrorBoundary noop>$self.renderMinimap(arguments[0])</ErrorBoundary>";
                    } else {
                        return "";
                    }
                }
            }
        }
    ],

    renderMinimap(props: any) {
        const channelId = props.channel?.id;
        if (!channelId) return null;

        return <MinimapWrapper channelId={channelId} />;
    }
});
