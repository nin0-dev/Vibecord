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

import {
    FluxDispatcher,
    MessageActions,
    MessageStore,
    React,
    useEffect,
    useMemo,
    useRef,
    UserStore,
    useState,
    useStateFromStores } from "@webpack/common";

import { settings } from "./index";

interface VantageMinimapProps {
    channel: { id: string; };
}

export function VantageMinimap({ channel }: VantageMinimapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewport, setViewport] = useState({ top: 0, height: 0, totalHeight: 0 });
    const [messages, setMessages] = useState<any[]>([]);
    const currentSettings = settings.use();

    const currentUser = useStateFromStores([UserStore], () => UserStore.getCurrentUser());

    const updateMessages = React.useCallback(() => {
        const msgCollection = MessageStore.getMessages(channel.id);
        if (msgCollection) {
            setMessages(msgCollection.toArray());
        }
    }, [channel.id]);

    useEffect(() => {
        updateMessages();

        const handleFlux = () => updateMessages();
        FluxDispatcher.subscribe("MESSAGE_CREATE", handleFlux);
        FluxDispatcher.subscribe("MESSAGE_DELETE", handleFlux);
        FluxDispatcher.subscribe("MESSAGE_UPDATE", handleFlux);
        FluxDispatcher.subscribe("LOAD_MESSAGES_SUCCESS", handleFlux);

        return () => {
            FluxDispatcher.unsubscribe("MESSAGE_CREATE", handleFlux);
            FluxDispatcher.unsubscribe("MESSAGE_DELETE", handleFlux);
            FluxDispatcher.unsubscribe("MESSAGE_UPDATE", handleFlux);
            FluxDispatcher.unsubscribe("LOAD_MESSAGES_SUCCESS", handleFlux);
        };
    }, [updateMessages]);

    useEffect(() => {
        const scroller = containerRef.current?.closest("[class*='messagesWrapper']")?.querySelector("[class*='scroller']");
        if (!scroller) return;

        const handleScroll = () => {
            setViewport({
                top: scroller.scrollTop,
                height: scroller.clientHeight,
                totalHeight: scroller.scrollHeight
            });
        };

        scroller.addEventListener("scroll", handleScroll);
        // Initial sync
        handleScroll();

        const resizeObserver = new ResizeObserver(handleScroll);
        resizeObserver.observe(scroller);

        return () => {
            scroller.removeEventListener("scroll", handleScroll);
            resizeObserver.disconnect();
        };
    }, [channel.id]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || messages.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { width } = currentSettings;
        const height = canvas.height = canvas.offsetHeight;
        canvas.width = width;

        ctx.clearRect(0, 0, width, height);

        const msgHeight = height / messages.length;

        messages.forEach((msg, i) => {
            let color = "rgba(128, 128, 128, 0.3)"; // Default

            if (currentSettings.showOwn && msg.author.id === currentUser?.id) {
                color = "var(--brand-experiment)";
            } else if (currentSettings.showMentions && msg.mentioned) {
                color = "var(--status-warning)";
            } else if (currentSettings.showAttachments && msg.attachments?.length > 0) {
                color = "var(--status-positive)";
            }

            ctx.fillStyle = color;
            ctx.fillRect(2, i * msgHeight, width - 4, Math.max(1, msgHeight - 1));
        });
    }, [messages, viewport.totalHeight, currentUser, currentSettings]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || messages.length === 0) return;

        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const percent = y / rect.height;
        const msgIndex = Math.floor(percent * messages.length);
        const targetMsg = messages[Math.min(msgIndex, messages.length - 1)];

        if (targetMsg) {
            MessageActions.jumpToMessage({
                channelId: channel.id,
                messageId: targetMsg.id,
                flash: true
            });
        }
    };

    const viewportStyle = useMemo(() => {
        if (viewport.totalHeight === 0) return { display: "none" };
        const top = (viewport.top / viewport.totalHeight) * 100;
        const height = (viewport.height / viewport.totalHeight) * 100;
        return {
            top: `${top}%`,
            height: `${height}%`,
            width: `${currentSettings.width}px`
        } as React.CSSProperties;
    }, [viewport, currentSettings.width]);

    return (
        <div ref={containerRef} className="vc-vantage-container" style={{ width: currentSettings.width }}>
            <canvas
                ref={canvasRef}
                className="vc-vantage-canvas"
                onClick={handleCanvasClick}
            />
            <div className="vc-vantage-viewport" style={viewportStyle} />
        </div>
    );
}
