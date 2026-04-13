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

import { MessageActions, Parser, React } from "@webpack/common";

import { Tether, useTetherStore } from "./store";

export function TetheredMessage({ tether }: { tether: Tether; }) {
    const { untetherMessage, toggleGlobal } = useTetherStore();

    const jumpToMessage = () => {
        MessageActions.jumpToMessage({
            channelId: tether.channelId,
            messageId: tether.id,
            flash: true
        });
    };

    return (
        <div className="vc-tether-card">
            <div className="vc-tether-header">
                <span className="vc-tether-author">{tether.author}</span>
                <div className="vc-tether-actions">
                    <button
                        className="vc-tether-btn"
                        onClick={() => toggleGlobal(tether.id)}
                        title={tether.isGlobal ? "Make Channel-specific" : "Make Global"}
                    >
                        {tether.isGlobal ? "🌎" : "📍"}
                    </button>
                    <button
                        className="vc-tether-btn"
                        onClick={() => untetherMessage(tether.id)}
                        title="Untether"
                    >
                        ✕
                    </button>
                </div>
            </div>
            <div className="vc-tether-content" onClick={jumpToMessage}>
                {Parser.parse(tether.content, true, { channelId: tether.channelId })}
            </div>
        </div>
    );
}
