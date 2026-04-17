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

import { ChannelStore, Parser, React, ScrollerThin, useStateFromStores } from "@webpack/common";

import { MirroredMessage, settings, useMirrorStore } from "./store";

function MirrorMessageItem({ message }: { message: MirroredMessage; }) {
    return (
        <div className="vc-mirror-message">
            <div className="vc-mirror-message-header">
                <span className="vc-mirror-author">{message.author.globalName ?? message.author.username}</span>
                <span className="vc-mirror-timestamp">{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="vc-mirror-content">
                {Parser.parse(message.content, true, { channelId: message.channelId })}
            </div>
        </div>
    );
}

function MirroredChannelSection({ channelId }: { channelId: string; }) {
    const channel = useStateFromStores([ChannelStore], () => ChannelStore.getChannel(channelId));
    const messages = useMirrorStore(state => state.messages[channelId] || []);

    if (!channel) return null;

    return (
        <div className="vc-mirror-channel-section">
            <div className="vc-mirror-channel-header">
                <span className="vc-mirror-channel-name">#{channel.name}</span>
            </div>
            <div className="vc-mirror-messages">
                {messages.length === 0 ? (
                    <div className="vc-mirror-empty">Waiting for messages...</div>
                ) : (
                    // Messages are stored newest first in store, so reverse for display if needed
                    // Actually, let's show newest at the bottom
                    [...messages].reverse().map(msg => (
                        <MirrorMessageItem key={msg.id} message={msg} />
                    ))
                )}
            </div>
        </div>
    );
}

export function MirrorPanel() {
    const mirroredChannels = useStateFromStores([settings], () => settings.store.mirroredChannels);

    return (
        <div className="vc-mirror-panel">
            <div className="vc-mirror-header">
                <span className="vc-mirror-title">Mirror</span>
            </div>
            <ScrollerThin className="vc-mirror-scroller">
                {mirroredChannels.length === 0 ? (
                    <div className="vc-mirror-empty-state">
                        Right click a channel and select "Mirror Channel" to start watching.
                    </div>
                ) : (
                    mirroredChannels.map(id => (
                        <MirroredChannelSection key={id} channelId={id} />
                    ))
                )}
            </ScrollerThin>
        </div>
    );
}
