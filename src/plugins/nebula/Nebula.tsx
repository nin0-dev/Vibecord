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

import { GuildMemberStore, GuildRoleStore, MessageStore, React, useLayoutEffect, useRef, useState, useStateFromStores } from "@webpack/common";

import { settings } from "./index";

interface NebulaProps {
    channelId: string;
}

interface ViewportState {
    top: number;
    height: number;
    totalHeight: number;
}

interface ProcessedMessage {
    id: string;
    y: number;
    color: string;
    weight: number;
    hasMedia: boolean;
    isMention: boolean;
    content: string;
    author: string;
}

export function Nebula({ channelId }: NebulaProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [viewport, setViewport] = useState<ViewportState>({ top: 0, height: 0, totalHeight: 0 });
    const [hoveredMsg, setHoveredMsg] = useState<ProcessedMessage | null>(null);
    const [mouseY, setMouseY] = useState(0);
    const messages = useStateFromStores([MessageStore], () => MessageStore.getMessages(channelId).toArray());

    const getRoleColor = (guildId: string | undefined, userId: string) => {
        if (!guildId) return "var(--text-normal)";
        const member = GuildMemberStore.getMember(guildId, userId);
        if (!member?.roles) return "var(--text-normal)";

        const roles = member.roles
            .map(roleId => GuildRoleStore.getRole(guildId, roleId))
            .filter(role => role && role.colorString)
            .sort((a, b) => b.position - a.position);

        return roles[0]?.colorString || "var(--text-normal)";
    };

    const processedMessages = React.useMemo(() => {
        const total = messages.length;
        if (total === 0) return [];

        return messages.map((msg, index) => {
            const hasMedia = msg.attachments?.length > 0 || msg.embeds?.length > 0;
            const isMention = msg.mentioned;

            return {
                id: msg.id,
                y: index / total,
                color: getRoleColor(msg.guild_id, msg.author.id),
                weight: Math.min(1, (msg.content?.length || 0) / 200 + 0.2),
                hasMedia,
                isMention,
                content: msg.content,
                author: msg.author.globalName ?? msg.author.username
            };
        });
    }, [messages]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const y = (e.clientY - rect.top) / rect.height;
        setMouseY(e.clientY - rect.top);

        let closest = null;
        let minDist = 0.05;

        for (const msg of processedMessages) {
            const dist = Math.abs(msg.y - y);
            if (dist < minDist) {
                minDist = dist;
                closest = msg;
            }
        }
        setHoveredMsg(closest);
    };

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const draw = () => {
            ctx.clearRect(0, 0, rect.width, rect.height);

            if (viewport.totalHeight > 0) {
                const viewTop = (viewport.top / viewport.totalHeight) * rect.height;
                const viewHeight = (viewport.height / viewport.totalHeight) * rect.height;
                ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
                ctx.fillRect(0, viewTop, rect.width, viewHeight);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
                ctx.strokeRect(0, viewTop, rect.width, viewHeight);
            }

            processedMessages.forEach(msg => {
                const y = msg.y * rect.height;
                const size = msg.weight * 3;

                if (msg.isMention) {
                    ctx.fillStyle = "rgba(242, 63, 66, 0.4)";
                    ctx.beginPath();
                    ctx.arc(rect.width / 2, y, size + 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (msg.hasMedia && settings.store.showMedia) {
                    ctx.fillStyle = "rgba(35, 165, 90, 0.4)";
                    ctx.fillRect(rect.width / 4, y - 1, rect.width / 2, 2);
                }

                if (msg.color.startsWith("var")) {
                    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue(msg.color.slice(4, -1)) || "white";
                } else {
                    ctx.fillStyle = msg.color;
                }

                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(rect.width / 2, y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            });
        };

        draw();
    }, [processedMessages, viewport]);

    useLayoutEffect(() => {
        const scroller = containerRef.current?.parentElement?.querySelector("[class*='scroller']");
        if (!scroller) return;

        const updateViewport = () => {
            setViewport({
                top: scroller.scrollTop,
                height: scroller.clientHeight,
                totalHeight: scroller.scrollHeight
            });
        };

        scroller.addEventListener("scroll", updateViewport);
        updateViewport();

        const resizeObserver = new ResizeObserver(updateViewport);
        resizeObserver.observe(scroller);

        const interval = setInterval(updateViewport, 1000);

        return () => {
            scroller.removeEventListener("scroll", updateViewport);
            resizeObserver.disconnect();
            clearInterval(interval);
        };
    }, [channelId]);

    return (
        <div
            ref={containerRef}
            className={`vc-nebula-container ${settings.store.position}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredMsg(null)}
            style={{ width: settings.store.width }}
        >
            <canvas ref={canvasRef} className="vc-nebula-canvas" />
            {hoveredMsg && (
                <div
                    className="vc-nebula-preview"
                    style={{
                        top: mouseY,
                        [settings.store.position === "right" ? "right" : "left"]: settings.store.width + 10
                    }}
                >
                    <div className="vc-nebula-preview-author" style={{ color: hoveredMsg.color }}>
                        {hoveredMsg.author}
                    </div>
                    <div className="vc-nebula-preview-content">
                        {hoveredMsg.content.slice(0, 100)}{hoveredMsg.content.length > 100 ? "..." : ""}
                    </div>
                </div>
            )}
        </div>
    );
}
