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
import { MessageActions, MessageStore, React, SelectedChannelStore, UserStore, useStateFromStores } from "@webpack/common";

const settings = definePluginSettings({
    width: {
        type: OptionType.NUMBER,
        description: "Width of the minimap (px)",
        default: 10
    },
    hoverExpand: {
        type: OptionType.BOOLEAN,
        description: "Expand minimap on hover",
        default: true
    },
    showMentions: {
        type: OptionType.BOOLEAN,
        description: "Highlight mentions",
        default: true
    },
    showOwn: {
        type: OptionType.BOOLEAN,
        description: "Highlight own messages",
        default: true
    },
    showMedia: {
        type: OptionType.BOOLEAN,
        description: "Highlight messages with attachments or links",
        default: true
    },
    mentionColor: {
        type: OptionType.STRING,
        description: "Color for mentions",
        default: "#faa61a"
    },
    ownColor: {
        type: OptionType.STRING,
        description: "Color for own messages",
        default: "#00aff4"
    },
    mediaColor: {
        type: OptionType.STRING,
        description: "Color for media messages",
        default: "#43b581"
    }
});

function EchoMap({ channelId }: { channelId: string; }) {
    const messages = useStateFromStores([MessageStore], () => MessageStore.getMessages(channelId).toArray());
    const currentUser = useStateFromStores([UserStore], () => UserStore.getCurrentUser());
    const { width, hoverExpand, showMentions, showOwn, showMedia, mentionColor, ownColor, mediaColor } = settings.use();
    const [viewport, setViewport] = React.useState({ top: 0, height: 0 });

    React.useLayoutEffect(() => {
        const scroller = document.querySelector("[class*='messagesWrapper'] [class*='scroller']");
        if (!scroller) return;

        const updateViewport = () => {
            const { scrollTop, scrollHeight, clientHeight } = scroller;
            setViewport({
                top: (scrollTop / scrollHeight) * 100,
                height: (clientHeight / scrollHeight) * 100
            });
        };

        updateViewport();
        scroller.addEventListener("scroll", updateViewport);
        const observer = new ResizeObserver(updateViewport);
        observer.observe(scroller);

        return () => {
            scroller.removeEventListener("scroll", updateViewport);
            observer.disconnect();
        };
    }, [channelId]);

    if (!messages.length) return null;

    const markers = React.useMemo(() => {
        return messages.map((msg, index) => {
            const isMention = showMentions && msg.mentioned;
            const isOwn = showOwn && msg.author?.id === currentUser?.id;
            const hasMedia = showMedia && (msg.attachments?.length > 0 || msg.embeds?.length > 0);

            if (!isMention && !isOwn && !hasMedia) return null;

            let type = "";
            let color = "";
            if (isMention) {
                type = "mention";
                color = "var(--vc-echomap-mention-color)";
            } else if (isOwn) {
                type = "own";
                color = "var(--vc-echomap-own-color)";
            } else if (hasMedia) {
                type = "media";
                color = "var(--vc-echomap-media-color)";
            }

            const top = (index / messages.length) * 100;

            return (
                <div
                    key={msg.id}
                    className={`vc-echomap-marker ${type}`}
                    style={{
                        top: `${top}%`,
                        backgroundColor: color
                    }}
                    onClick={() => MessageActions.jumpToMessage({
                        channelId,
                        messageId: msg.id,
                        flash: true,
                        jumpType: "INSTANT"
                    })}
                />
            );
        });
    }, [messages, currentUser, showMentions, showOwn, showMedia, channelId]);

    return (
        <div
            className={`vc-echomap-container ${hoverExpand ? "hover-expand" : ""}`}
            style={{
                width: `${width}px`,
                "--vc-echomap-mention-color": mentionColor,
                "--vc-echomap-own-color": ownColor,
                "--vc-echomap-media-color": mediaColor
            } as React.CSSProperties}
        >
            <div className="vc-echomap-track">
                <div
                    className="vc-echomap-viewport"
                    style={{
                        top: `${viewport.top}%`,
                        height: `${viewport.height}%`
                    }}
                />
                {markers}
            </div>
        </div>
    );
}

export default definePlugin({
    name: "EchoMap",
    description: "A minimap for your chat history. See mentions, own messages, and media at a glance.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1$self.EchoMapWrapper(arguments[0]),"
            }
        }
    ],

    EchoMapWrapper(props: any) {
        const channelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getChannelId());
        if (!channelId) return null;
        return (
            <ErrorBoundary noop>
                <EchoMap channelId={channelId} />
            </ErrorBoundary>
        );
    }
});
