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

import { sendMessage } from "@utils/discord";
import { ChannelStore, MessageStore, Parser, React, ScrollerThin, useState, useStateFromStores } from "@webpack/common";

import { usePortalStore } from "./store";

export function PortalWindow() {
    const { channelId, isVisible, x, y, setPosition, setIsVisible } = usePortalStore();
    const channel = useStateFromStores([ChannelStore], () => channelId ? ChannelStore.getChannel(channelId) : null);
    const messages = useStateFromStores([MessageStore], () => channelId ? MessageStore.getMessages(channelId).toArray().slice(-20) : []);
    const [inputValue, setInputValue] = useState("");

    const [isDragging, setIsDragging] = React.useState(false);
    const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (!isVisible || !channelId) return null;

    const onHeaderMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - x,
            y: e.clientY - y
        });
    };

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        sendMessage(channelId, { content: inputValue });
        setInputValue("");
    };

    return (
        <div
            className="vc-portal-window"
            style={{
                left: `${x}px`,
                top: `${y}px`
            }}
        >
            <div className="vc-portal-header" onMouseDown={onHeaderMouseDown}>
                <span className="vc-portal-title">Portal: #{channel?.name ?? "unknown"}</span>
                <div className="vc-portal-close" onClick={() => setIsVisible(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </div>
            </div>
            <ScrollerThin className="vc-portal-messages">
                {messages.length === 0 ? (
                    <div className="vc-portal-empty">No messages found.</div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className="vc-portal-message">
                            <span className="vc-portal-message-author">{msg.author.globalName ?? msg.author.username}:</span>
                            <span className="vc-portal-message-content">
                                {Parser.parse(msg.content, true, { channelId })}
                            </span>
                        </div>
                    ))
                )}
            </ScrollerThin>
            <div className="vc-portal-input-container">
                <input
                    className="vc-portal-input"
                    placeholder={`Message #${channel?.name ?? "channel"}`}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") handleSendMessage();
                    }}
                />
            </div>
        </div>
    );
}
