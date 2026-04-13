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

import { React, SelectedChannelStore, useStateFromStores } from "@webpack/common";

import { useTetherStore } from "./store";
import { TetheredMessage } from "./TetheredMessage";

export function TetherContainer() {
    const channelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getChannelId());
    const tethers = useTetherStore(state => state.tethers);

    const visibleTethers = tethers.filter(t => t.isGlobal || t.channelId === channelId);

    if (visibleTethers.length === 0) return null;

    return (
        <div className="vc-tether-container">
            {visibleTethers.map(tether => (
                <TetheredMessage key={tether.id} tether={tether} />
            ))}
        </div>
    );
}
