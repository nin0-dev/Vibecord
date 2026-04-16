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
import { ChannelStore, GuildMemberStore, MessageStore, React, SelectedChannelStore, UserStore, useStateFromStores } from "@webpack/common";

const settings = definePluginSettings({
    width: {
        type: OptionType.NUMBER,
        description: "Width of the minimap (px)",
        default: 60
    },
    showRoleColors: {
        type: OptionType.BOOLEAN,
        description: "Color markers based on user roles",
        default: true
    },
    highlightMentions: {
        type: OptionType.BOOLEAN,
        description: "Highlight messages that mention you",
        default: true
    },
    highlightSelf: {
        type: OptionType.BOOLEAN,
        description: "Highlight your own messages",
        default: true
    },
    hideScrollbar: {
        type: OptionType.BOOLEAN,
        description: "Hide the native scrollbar when the minimap is active",
        default: false
    }
});

const Classes = findCssClassesLazy("messagesWrapper", "scroller");

function Minimap({ channelId }: { channelId: string }) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const messages = useStateFromStores([MessageStore], () => MessageStore.getMessages(channelId).toArray());
    const channel = useStateFromStores([ChannelStore], () => ChannelStore.getChannel(channelId));
    const currentUser = useStateFromStores([UserStore], () => UserStore.getCurrentUser());
    const [viewport, setViewport] = React.useState({ top: 0, height: 0 });

    const getScroller = () => document.querySelector(`.${Classes.messagesWrapper} .${Classes.scroller}`) as HTMLElement;

    React.useLayoutEffect(() => {
        const scroller = getScroller();
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
        const resizeObserver = new ResizeObserver(updateViewport);
        resizeObserver.observe(scroller);

        return () => {
            scroller.removeEventListener("scroll", updateViewport);
            resizeObserver.disconnect();
        };
    }, [channelId, messages.length]);

    React.useEffect(() => {
        if (settings.store.hideScrollbar) {
            document.body.classList.add("vc-minimap-hide-scrollbar");
        } else {
            document.body.classList.remove("vc-minimap-hide-scrollbar");
        }
    }, [settings.store.hideScrollbar]);

    // Cleanup on unmount
    React.useEffect(() => () => {
        document.body.classList.remove("vc-minimap-hide-scrollbar");
    }, []);

    const handleInteraction = (e: React.MouseEvent) => {
        const container = containerRef.current;
        const scroller = getScroller();
        if (!container || !scroller) return;

        const rect = container.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const ratio = y / rect.height;
        scroller.scrollTop = ratio * scroller.scrollHeight - scroller.clientHeight / 2;
    };

    const [isDragging, setIsDragging] = React.useState(false);

    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleInteraction(e);
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const onMouseMove = (e: MouseEvent) => {
            handleInteraction(e as any);
        };

        const onMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [isDragging]);

    const getMarkerProps = (msg: any) => {
        let color = "var(--text-muted)";
        let opacity = 0.5;
        let isSpecial = false;

        if (settings.store.highlightMentions && msg.mentions?.includes(currentUser?.id)) {
            color = "var(--status-danger)";
            opacity = 1;
            isSpecial = true;
        } else if (settings.store.highlightSelf && msg.author.id === currentUser?.id) {
            color = "var(--brand-experiment)";
            opacity = 1;
            isSpecial = true;
        } else if (settings.store.showRoleColors && channel?.guild_id) {
            const member = GuildMemberStore.getMember(channel.guild_id, msg.author.id);
            if (member?.colorString) {
                color = member.colorString;
            }
        }

        return { color, opacity, isSpecial };
    };

    return (
        <div
            className="vc-minimap"
            ref={containerRef}
            style={{ width: settings.store.width }}
            onMouseDown={onMouseDown}
        >
            <div className="vc-minimap-track">
                {messages.map((msg, index) => {
                    const { color, opacity, isSpecial } = getMarkerProps(msg);
                    return (
                        <div
                            key={msg.id}
                            className={`vc-minimap-marker ${isSpecial ? "special" : ""}`}
                            style={{
                                top: `${(index / messages.length) * 100}%`,
                                height: `${Math.max(0.1, (1 / messages.length) * 100)}%`,
                                background: color,
                                opacity
                            }}
                        />
                    );
                })}
            </div>
            <div
                className="vc-minimap-viewport"
                style={{
                    top: `${viewport.top}%`,
                    height: `${viewport.height}%`
                }}
            />
        </div>
    );
}

export default definePlugin({
    name: "Minimap",
    description: "A VS Code-style minimap for the message list, providing a visual overview and quick navigation.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1<ErrorBoundary noop>$self.MinimapWrapper(arguments[0])</ErrorBoundary>,"
            }
        }
    ],

    MinimapWrapper(props: any) {
        const channelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getChannelId());
        if (!channelId) return null;
        return <Minimap channelId={channelId} />;
    }
});
