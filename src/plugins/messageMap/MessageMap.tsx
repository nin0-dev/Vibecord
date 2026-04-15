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
    MessageActions,
    MessageStore,
    React,
    SelectedChannelStore,
    useCallback,
    useEffect,
    useMemo,
    UserStore,
    useState,
    useStateFromStores } from "@webpack/common";

import { settings } from "./index";

const SCROLLER_SELECTOR = "[class*='messagesWrapper'] [class*='scroller']";

export function MessageMap() {
    const channelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getChannelId());
    const messages = useStateFromStores([MessageStore], () => channelId ? MessageStore.getMessages(channelId).toArray() : []);
    const currentUser = useStateFromStores([UserStore], () => UserStore.getCurrentUser());
    const { showOwn, showMentions, mapWidth } = settings.use();

    const [scrollerInfo, setScrollerInfo] = useState({ height: 0, top: 0, scrollHeight: 0 });

    const updateScroller = useCallback(() => {
        const scroller = document.querySelector(SCROLLER_SELECTOR) as HTMLElement;
        if (scroller) {
            setScrollerInfo({
                height: scroller.clientHeight,
                top: scroller.scrollTop,
                scrollHeight: scroller.scrollHeight
            });
        }
    }, []);

    useEffect(() => {
        const scroller = document.querySelector(SCROLLER_SELECTOR);
        if (scroller) {
            scroller.addEventListener("scroll", updateScroller);
            const observer = new ResizeObserver(updateScroller);
            observer.observe(scroller);
            updateScroller();
            return () => {
                scroller.removeEventListener("scroll", updateScroller);
                observer.disconnect();
            };
        }
    }, [updateScroller, channelId]);

    const handleJump = useCallback((messageId: string) => {
        if (channelId) {
            MessageActions.jumpToMessage({
                channelId,
                messageId,
                flash: true
            });
        }
    }, [channelId]);

    const markers = useMemo(() => {
        if (messages.length === 0) return [];

        return messages.map((msg, index) => {
            const isOwn = msg.author.id === currentUser?.id;
            const isMention = msg.mentions.includes(currentUser?.id ?? "");

            if ((isOwn && !showOwn) || (isMention && !showMentions) || (!isOwn && !isMention)) return null;

            // Approximate position based on message index
            const top = (index / messages.length) * 100;

            return (
                <div
                    key={msg.id}
                    className={`vc-msg-map-marker ${isOwn ? "own" : ""} ${isMention ? "mention" : ""}`}
                    style={{
                        top: `${top}%`,
                        height: `${Math.max(0.5, 100 / messages.length)}%`,
                        minHeight: "2px"
                    }}
                    onClick={() => handleJump(msg.id)}
                />
            );
        }).filter(Boolean);
    }, [messages, currentUser?.id, showOwn, showMentions, handleJump]);

    if (messages.length === 0) return null;

    const viewportTop = scrollerInfo.scrollHeight ? (scrollerInfo.top / scrollerInfo.scrollHeight) * 100 : 0;
    const viewportHeight = scrollerInfo.scrollHeight ? (scrollerInfo.height / scrollerInfo.scrollHeight) * 100 : 0;

    return (
        <div className="vc-msg-map-container" style={{ width: `${mapWidth}px` }}>
            <div className="vc-msg-map-viewport" style={{ top: `${viewportTop}%`, height: `${viewportHeight}%` }} />
            {markers}
        </div>
    );
}
