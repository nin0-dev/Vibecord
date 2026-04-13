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

import "./style.css";

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Menu, React } from "@webpack/common";

import { useTetherStore } from "./store";
import { TetherContainer } from "./TetherContainer";

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const { message } = props;
    if (!message) return;

    const { tethers, tetherMessage, untetherMessage } = useTetherStore.getState();
    const isTethered = tethers.some(t => t.id === message.id);

    const group = findGroupChildrenByChildId("copy-link", children) ?? children;

    group.push(
        <Menu.MenuItem
            id="tether-message"
            label={isTethered ? "Untether Message" : "Tether Message"}
            color={isTethered ? "danger" : undefined}
            action={() => {
                if (isTethered) {
                    untetherMessage(message.id);
                } else {
                    tetherMessage(message);
                }
            }}
        />
    );
};

export default definePlugin({
    name: "Tether",
    description: "Tether specific messages to a persistent floating overlay. Click to jump back to them anytime.",
    authors: [Devs.nin0dev],

    patches: [
        {
            find: "className:\\i.messagesWrapper",
            replacement: {
                match: /(children:\[)/,
                replace: "$1<ErrorBoundary noop>$self.TetherWrapper()</ErrorBoundary>,"
            }
        }
    ],

    TetherWrapper() {
        return <TetherContainer />;
    },

    contextMenus: {
        "message": messageContextMenuPatch
    }
});
