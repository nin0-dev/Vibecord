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

import { MessageActions, MessageStore, React, UserStore, useStateFromStores } from "@webpack/common";

interface MinimapProps {
    channelId: string;
    scrollerRef: React.RefObject<HTMLDivElement | null>;
    settings: any;
}

export function Minimap({ channelId, scrollerRef, settings }: MinimapProps) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const messages = useStateFromStores([MessageStore], () => MessageStore.getMessages(channelId).toArray());
    const [viewport, setViewport] = React.useState({ top: 0, height: 0, scrollHeight: 1 });
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

    React.useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const updateViewport = () => {
            setViewport({
                top: scroller.scrollTop,
                height: scroller.clientHeight,
                scrollHeight: scroller.scrollHeight
            });
        };

        scroller.addEventListener("scroll", updateViewport);
        const resizeObserver = new ResizeObserver(updateViewport);
        resizeObserver.observe(scroller);

        updateViewport();

        return () => {
            scroller.removeEventListener("scroll", updateViewport);
            resizeObserver.disconnect();
        };
    }, [scrollerRef]);

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateDimensions = () => {
            setDimensions({
                width: container.clientWidth,
                height: container.clientHeight
            });
        };

        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(container);
        updateDimensions();

        return () => resizeObserver.disconnect();
    }, []);

    React.useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { width, height } = dimensions;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        ctx.clearRect(0, 0, width, height);

        if (messages.length === 0) return;

        const msgHeight = height / messages.length;
        const currentUserId = UserStore.getCurrentUser()?.id;

        messages.forEach((msg, i) => {
            const y = i * msgHeight;

            let color = "rgba(255, 255, 255, 0.1)"; // Default message line

            if (msg.author.id === currentUserId) {
                color = settings.ownMessageColor || "var(--brand-experiment)";
            } else if (msg.mentioned) {
                color = settings.mentionColor || "var(--status-warning)";
            }

            ctx.fillStyle = color;
            ctx.fillRect(2, y, width - 4, Math.max(0.5, msgHeight * 0.8));
        });

        // Viewport highlight
        const viewTop = (viewport.top / viewport.scrollHeight) * height;
        const viewHeight = (viewport.height / viewport.scrollHeight) * height;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, viewTop, width - 1, viewHeight);
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(0, viewTop, width, viewHeight);

    }, [messages, viewport, dimensions, settings]);

    const handleClick = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas || messages.length === 0) return;

        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const percent = y / rect.height;
        const index = Math.floor(percent * messages.length);
        const targetMsg = messages[Math.min(index, messages.length - 1)];

        if (targetMsg) {
            MessageActions.jumpToMessage({
                channelId: targetMsg.channel_id,
                messageId: targetMsg.id,
                flash: true,
                jumpType: "INSTANT"
            });
        }
    };

    return (
        <div ref={containerRef} className="vc-chat-minimap-container" style={{ width: settings.width || 40 }}>
            <canvas
                ref={canvasRef}
                className="vc-chat-minimap-canvas"
                onClick={handleClick}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
}
