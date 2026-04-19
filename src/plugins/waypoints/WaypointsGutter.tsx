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

import { MessageActions, MessageStore, React, useEffect, useMemo, useRef, UserStore, useState, useStateFromStores } from "@webpack/common";

import { settings } from "./index";

interface Marker {
    id: string;
    type: "waypoint" | "mention" | "own";
    author: string;
    content: string;
    pos?: number;
}

export function WaypointsGutter({ channel }: { channel: any; }) {
    if (!channel) return null;

    const channelId = channel.id;
    const [scrollerInfo, setScrollerInfo] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });
    const gutterRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { waypoints: allWaypoints, showMentions, showOwnMessages } = settings.use(["waypoints", "showMentions", "showOwnMessages"]);
    const waypoints = allWaypoints[channelId] || [];

    // Use useStateFromStores to react to message updates
    const messages = useStateFromStores([MessageStore], () => {
        const msgCollection = MessageStore.getMessages(channelId);
        return msgCollection ? msgCollection.toArray() : [];
    });

    const currentUser = UserStore.getCurrentUser();

    useEffect(() => {
        const scroller = document.querySelector("[class*=\"messagesWrapper\"] [class*=\"scroller\"]");
        if (!scroller) return;

        const handleScroll = () => {
            setScrollerInfo({
                scrollTop: scroller.scrollTop,
                scrollHeight: scroller.scrollHeight,
                clientHeight: scroller.clientHeight
            });
        };

        const resizeObserver = new ResizeObserver(handleScroll);
        resizeObserver.observe(scroller);
        scroller.addEventListener("scroll", handleScroll, { passive: true });

        handleScroll();

        return () => {
            scroller.removeEventListener("scroll", handleScroll);
            resizeObserver.disconnect();
        };
    }, [channelId]);

    const markers = useMemo(() => {
        if (scrollerInfo.scrollHeight === 0 || messages.length === 0) return [];

        const result: Marker[] = [];

        // Add waypoints
        for (const wp of waypoints) {
            const msg = messages.find(m => m.id === wp.messageId);
            if (msg) {
                result.push({ id: wp.messageId, type: "waypoint", author: wp.author, content: wp.content });
            }
        }

        // Add mentions and own messages if enabled
        if (showMentions || showOwnMessages) {
            for (const msg of messages) {
                const isMention = showMentions && msg.mentions?.includes(currentUser?.id);
                const isOwn = showOwnMessages && msg.author?.id === currentUser?.id;

                if (isMention || isOwn) {
                    if (!result.some(r => r.id === msg.id)) {
                        result.push({
                            id: msg.id,
                            type: isMention ? "mention" : "own",
                            author: msg.author?.globalName ?? msg.author?.username ?? "Unknown",
                            content: msg.content ?? ""
                        });
                    }
                }
            }
        }

        return result.map(m => {
            const el = document.getElementById(`chat-messages-${channelId}-${m.id}`);
            let pos: number;

            if (el) {
                pos = el.offsetTop / scrollerInfo.scrollHeight;
            } else {
                // Fallback for virtualized messages: estimate position based on index in buffer
                const index = messages.findIndex(msg => msg.id === m.id);
                if (index === -1) return null;
                pos = index / messages.length;
            }

            return { ...m, pos };
        }).filter(m => m !== null) as Marker[];
    }, [messages, waypoints, scrollerInfo.scrollHeight, showMentions, showOwnMessages, currentUser?.id, channelId]);

    const viewboxTop = (scrollerInfo.scrollTop / scrollerInfo.scrollHeight) * 100;
    const viewboxHeight = (scrollerInfo.clientHeight / scrollerInfo.scrollHeight) * 100;

    return (
        <div className="vc-waypoints-gutter" ref={gutterRef}>
            <div className="vc-waypoints-container" ref={containerRef}>
                <div
                    className="vc-waypoints-viewbox"
                    style={{
                        top: `${viewboxTop}%`,
                        height: `${viewboxHeight}%`
                    }}
                />
                {markers.map(m => (
                    <div
                        key={m.id}
                        className={`vc-waypoints-marker vc-waypoints-marker-${m.type}`}
                        style={{ top: `${(m.pos ?? 0) * 100}%` }}
                        onClick={() => MessageActions.jumpToMessage({
                            channelId,
                            messageId: m.id,
                            flash: true,
                            jumpType: "INSTANT"
                        })}
                        title={`${m.author}: ${m.content.substring(0, 50)}${m.content.length > 50 ? "..." : ""}`}
                    />
                ))}
            </div>
        </div>
    );
}
