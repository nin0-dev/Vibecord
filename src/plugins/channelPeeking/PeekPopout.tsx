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

import { Heading } from "@components/Heading";
import { Message } from "@vencord/discord-types";
import { MessageStore, Parser, React, RestAPI, ScrollerThin, useEffect, useState, useStateFromStores } from "@webpack/common";

export function PeekPopout({ channelId, channelName }: { channelId: string; channelName: string; }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const cachedMessages = useStateFromStores([MessageStore], () => MessageStore.getMessages(channelId));

    useEffect(() => {
        const fetchMessages = async () => {
            if (cachedMessages && cachedMessages.length >= 10) {
                setMessages(cachedMessages.toArray().slice(-10));
                setLoading(false);
                return;
            }

            try {
                const res = await RestAPI.get({
                    url: `/channels/${channelId}/messages`,
                    query: { limit: 10 }
                });
                if (res.ok && res.body) {
                    setMessages(res.body);
                }
            } catch (err) {
                console.error("Failed to fetch messages for peek", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [channelId, cachedMessages]);

    return (
        <div className="vc-peek-popout">
            <div className="vc-peek-header">
                <Heading tag="h3">Peeking: #{channelName}</Heading>
            </div>
            <ScrollerThin className="vc-peek-messages">
                {loading ? (
                    <div className="vc-peek-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="vc-peek-empty">No messages found.</div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className="vc-peek-message">
                            <div className="vc-peek-author-line">
                                <span className="vc-peek-author">{msg.author.globalName ?? msg.author.username}</span>
                                <span className="vc-peek-timestamp">{new Date(msg.timestamp as any).toLocaleString()}</span>
                            </div>
                            <div className="vc-peek-content">
                                {Parser.parse(msg.content, true, { channelId })}
                            </div>
                        </div>
                    ))
                )}
            </ScrollerThin>
        </div>
    );
}
