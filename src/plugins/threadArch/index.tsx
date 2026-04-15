/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Devs.nin0.dev and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { React, useLayoutEffect, useRef, useState } from "@webpack/common";

import { useThreadArchStore } from "./store";

function ThreadArchOverlay({ channelId }: { channelId: string; }) {
    const { hoveredMessageId, parentMessageId } = useThreadArchStore();
    const [path, setPath] = useState<string | null>(null);
    const [isParentOffscreen, setIsParentOffscreen] = useState<"above" | "below" | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useLayoutEffect(() => {
        if (!hoveredMessageId || !parentMessageId || !channelId) {
            setPath(null);
            setIsParentOffscreen(null);
            return;
        }

        let frame: number;
        const updatePath = () => {
            const svg = svgRef.current;
            if (!svg) return;
            const svgRect = svg.getBoundingClientRect();

            const getMsgPos = (id: string) => {
                const el = document.getElementById(`chat-messages-${channelId}-${id}`);
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                return {
                    top: rect.top - svgRect.top,
                    bottom: rect.bottom - svgRect.top,
                    left: rect.left - svgRect.left,
                    right: rect.right - svgRect.left,
                    width: rect.width,
                    height: rect.height
                };
            };

            const hoveredPos = getMsgPos(hoveredMessageId);
            const parentPos = getMsgPos(parentMessageId);

            if (hoveredPos) {
                const startX = hoveredPos.left + 20;
                const startY = hoveredPos.top + 15;

                if (parentPos) {
                    setIsParentOffscreen(null);
                    const endX = parentPos.left + 20;
                    const endY = parentPos.top + parentPos.height / 2;

                    const cp1x = Math.min(startX, endX) - 50;
                    const cp1y = startY;
                    const cp2x = Math.min(startX, endX) - 50;
                    const cp2y = endY;

                    setPath(`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`);
                } else {
                    const isAbove = BigInt(parentMessageId) < BigInt(hoveredMessageId);
                    setIsParentOffscreen(isAbove ? "above" : "below");

                    const endY = isAbove ? -20 : svgRect.height + 20;
                    const endX = startX - 20;

                    const cp1x = startX - 40;
                    const cp1y = startY;
                    const cp2x = startX - 40;
                    const cp2y = endY;

                    setPath(`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`);
                }
            } else {
                setPath(null);
                setIsParentOffscreen(null);
            }
            frame = requestAnimationFrame(updatePath);
        };

        frame = requestAnimationFrame(updatePath);
        return () => cancelAnimationFrame(frame);
    }, [hoveredMessageId, parentMessageId, channelId]);

    if (!path) return <svg ref={svgRef} className="vc-thread-arch-svg" />;

    const lastPoint = path.split(" ").slice(-2);

    return (
        <svg ref={svgRef} className="vc-thread-arch-svg">
            <path
                d={path}
                className={`vc-thread-arch-path ${path ? "active" : ""}`}
                stroke="var(--brand-experiment)"
                fill="none"
                strokeWidth="2"
                strokeDasharray="4,4"
            >
                <animate
                    attributeName="stroke-dashoffset"
                    from="100"
                    to="0"
                    dur="3s"
                    repeatCount="indefinite"
                />
            </path>
            {isParentOffscreen && (
                <text
                    x={lastPoint[0]}
                    y={isParentOffscreen === "above" ? 20 : "98%"}
                    fill="var(--brand-experiment)"
                    fontSize="12"
                    textAnchor="middle"
                    style={{ opacity: 0.8, fontWeight: "bold" }}
                >
                    {isParentOffscreen === "above" ? "↑ Parent" : "↓ Parent"}
                </text>
            )}
        </svg>
    );
}

export default definePlugin({
    name: "ThreadArch",
    description: "Visually connects replies to their parent messages with elegant, animated arcs when hovering.",
    authors: [Devs.nin0dev],

    flux: {
        CHANNEL_SELECT: () => useThreadArchStore.getState().clearHovered()
    },

    patches: [
        {
            find: "Message must not be a thread starter message",
            replacement: [
                {
                    match: /\)\("li",\{(.+?),className:/,
                    replace: ')("li",{$1,onMouseEnter:()=>$self.handleMouseEnter(arguments[0]),onMouseLeave:()=>$self.handleMouseLeave(),className:$self.getMessageClass(arguments[0])+" '
                }
            ]
        },
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1<ErrorBoundary noop>$self.ThreadArchWrapper(arguments[0])</ErrorBoundary>,"
            }
        }
    ],

    ThreadArchWrapper(props: any) {
        return <ThreadArchOverlay channelId={props.channel?.id} />;
    },

    handleMouseEnter(props: any) {
        const { message } = props;
        if (message?.messageReference?.message_id) {
            useThreadArchStore.getState().setHovered(message.id, message.messageReference.message_id);
        }
    },

    handleMouseLeave() {
        useThreadArchStore.getState().clearHovered();
    },

    getMessageClass(props: any) {
        const { message } = props;
        if (!message) return "";
        const { hoveredMessageId, parentMessageId } = useThreadArchStore.getState();
        if (message.id === hoveredMessageId || message.id === parentMessageId) {
            return "vc-thread-arch-highlight";
        }
        return "";
    }
});
