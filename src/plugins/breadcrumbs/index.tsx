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

import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher, React } from "@webpack/common";
import type { PropsWithChildren } from "react";

import { Breadcrumbs } from "./Breadcrumbs";
import { pushToHistory, settings } from "./store";

export default definePlugin({
    name: "Breadcrumbs",
    description: "Keep track of your recently visited channels with a breadcrumb trail in the header bar.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: '?"BACK_FORWARD_NAVIGATION":',
            replacement: {
                match: /(?<=trailing:.{0,50})\i\.Fragment,(?=\{children:\[)/,
                replace: "$self.TrailingWrapper,"
            }
        }
    ],

    TrailingWrapper({ children }: PropsWithChildren) {
        return (
            <>
                <ErrorBoundary key="vc-breadcrumbs" noop>
                    <Breadcrumbs />
                </ErrorBoundary>
                {children}
            </>
        );
    },

    start() {
        FluxDispatcher.subscribe("CHANNEL_SELECT", this.onChannelSelect);
    },

    stop() {
        FluxDispatcher.unsubscribe("CHANNEL_SELECT", this.onChannelSelect);
    },

    onChannelSelect({ channelId }: { channelId: string; }) {
        if (channelId) {
            pushToHistory(channelId);
        }
    }
});
