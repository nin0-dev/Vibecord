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
import { MessageStore, React, useLayoutEffect, useRef, useState } from "@webpack/common";

import { useLoomStore } from "./store";

const settings = definePluginSettings({
    lineColor: {
        type: OptionType.STRING,
        description: "The color of the thread lines (CSS color)",
        default: "var(--brand-experiment)"
    },
    lineWidth: {
        type: OptionType.NUMBER,
        description: "The width of the thread lines",
        default: 2
    },
    opacity: {
        type: OptionType.NUMBER,
        description: "The opacity of the thread lines (0-1)",
        default: 0.6
    }
});

function LoomCanvas({ channelId }: { channelId: string; }) {
    const { highlightedIds, rootId } = useLoomStore();
    const [paths, setPaths] = useState<string[]>([]);
    const containerRef = useRef<SVGSVGElement>(null);

    useLayoutEffect(() => {
        if (highlightedIds.size === 0 || !rootId) {
            setPaths([]);
            return;
        }

        const updatePaths = () => {
            const newPaths: string[] = [];
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect) return;

            const getMsgCenter = (id: string) => {
                const el = document.getElementById(`chat-messages-${channelId}-${id}`);
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                return {
                    x: rect.left - containerRect.left + 10, // Offset to the gutter
                    y: rect.top - containerRect.top + rect.height / 2
                };
            };

            const rootPos = getMsgCenter(rootId);
            if (!rootPos) return;

            highlightedIds.forEach(id => {
                if (id === rootId) return;
                const msg = MessageStore.getMessage(channelId, id);
                if (!msg?.messageReference?.message_id) return;

                const startPos = getMsgCenter(msg.messageReference.message_id);
                const endPos = getMsgCenter(id);

                if (startPos && endPos) {
                    // Create a curved path
                    const cp1x = startPos.x + 20;
                    const cp1y = startPos.y;
                    const cp2x = startPos.x + 20;
                    const cp2y = endPos.y;
                    newPaths.push(`M ${startPos.x} ${startPos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPos.x} ${endPos.y}`);
                }
            });

            setPaths(newPaths);
        };

        updatePaths();
        let frame: number;
        const loop = () => {
            updatePaths();
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
    }, [highlightedIds, rootId, channelId]);

    return (
        <svg ref={containerRef} className="vc-loom-canvas">
            {paths.map((d, i) => (
                <path
                    key={i}
                    d={d}
                    className="vc-loom-line"
                    style={{
                        stroke: settings.store.lineColor,
                        strokeWidth: settings.store.lineWidth,
                        opacity: settings.store.opacity
                    }}
                />
            ))}
        </svg>
    );
}

export default definePlugin({
    name: "Loom",
    description: "Visually weave together conversation threads by highlighting reply chains on hover.",
    authors: [Devs.nin0dev],
    settings,

    flux: {
        CHANNEL_SELECT: () => {
            useLoomStore.getState().clearHighlighted();
        }
    },

    stop() {
        useLoomStore.getState().clearHighlighted();
    },

    patches: [
        {
            find: "Message must not be a thread starter message",
            replacement: [
                {
                    match: /\)\("li",\{(.+?),className:/,
                    replace: ")(\"li\",{$1,onMouseEnter:()=>$self.handleMouseEnter(arguments[0]),onMouseLeave:()=>$self.handleMouseLeave(),className:$self.getMessageClass(arguments[0])+"
                }
            ]
        },
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1<ErrorBoundary noop>$self.LoomWrapper(arguments[0])</ErrorBoundary>,"
            }
        }
    ],

    LoomWrapper(props: any) {
        return <LoomCanvas channelId={props.channel?.id} />;
    },

    handleMouseEnter(props: any) {
        const { message } = props;
        if (!message) return;

        const highlighted = new Set<string>();
        let current = message;
        let root = message.id;

        // Trace up to the root
        while (current?.messageReference?.message_id) {
            highlighted.add(current.id);
            const nextId = current.messageReference.message_id;
            highlighted.add(nextId);
            root = nextId;
            current = MessageStore.getMessage(current.channel_id, nextId);
        }

        // Trace down to all descendants in the current view
        const messages = MessageStore.getMessages(message.channel_id).toArray();
        let foundNew = true;
        while (foundNew) {
            foundNew = false;
            messages.forEach(msg => {
                if (!highlighted.has(msg.id) && msg.messageReference?.message_id && highlighted.has(msg.messageReference.message_id)) {
                    highlighted.add(msg.id);
                    foundNew = true;
                }
            });
        }

        useLoomStore.getState().setHighlighted(highlighted, root);
    },

    handleMouseLeave() {
        useLoomStore.getState().clearHighlighted();
    },

    getMessageClass(props: any) {
        const { message } = props;
        if (!message) return "";

        const { highlightedIds, rootId } = useLoomStore.getState();
        let classes = "";
        if (highlightedIds.has(message.id)) classes += "vc-loom-highlighted ";
        if (message.id === rootId) classes += "vc-loom-root ";
        return classes;
    }
});
