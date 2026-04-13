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
import { MessageStore, Parser, React, ScrollerThin, useStateFromStores } from "@webpack/common";

import { useThreadStore } from "./store";

function ThreadMessage({ messageId, channelId }: { messageId: string; channelId: string; }) {
    const message = useStateFromStores([MessageStore], () => MessageStore.getMessage(channelId, messageId));

    if (!message) return null;

    const timestamp = message.timestamp && typeof message.timestamp.toDate === "function"
        ? message.timestamp.toDate().toLocaleString()
        : (message.timestamp instanceof Date ? message.timestamp.toLocaleString() : "Unknown date");

    return (
        <div className="vc-thread-reader-message">
            <div className="vc-thread-reader-meta">
                <span className="vc-thread-reader-author">{message.author.username}</span>
                <span className="vc-thread-reader-timestamp">{timestamp}</span>
            </div>
            <div className="vc-thread-reader-content">
                {Parser.parse(message.content, true, { channelId })}
            </div>
        </div>
    );
}

export function ThreadReaderPopout({ close }: { close: () => void; }) {
    const { channelId, messageIds } = useThreadStore();

    return (
        <div className="vc-thread-reader-popout">
            <div className="vc-thread-reader-header">
                <Heading tag="h2">Thread Reader</Heading>
            </div>
            <ScrollerThin className="vc-thread-reader-scroller">
                {channelId && messageIds.length > 0 ? (
                    messageIds.map(id => (
                        <ThreadMessage key={id} messageId={id} channelId={channelId} />
                    ))
                ) : (
                    <div className="vc-thread-reader-empty">
                        No thread active. Right-click a message and select "Read Thread" to begin.
                    </div>
                )}
            </ScrollerThin>
        </div>
    );
}
