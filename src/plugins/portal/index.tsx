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
import { findComponentByCodeLazy } from "@webpack";
import { React, SelectedChannelStore } from "@webpack/common";
import type { PropsWithChildren } from "react";

import { PortalWindow } from "./PortalWindow";
import { usePortalStore } from "./store";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function PortalIcon() {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="4"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
    );
}

function PortalToggleButton() {
    const { channelId: portaledChannelId, setChannelId, toggleVisible, isVisible } = usePortalStore();
    const currentChannelId = SelectedChannelStore.getChannelId();

    const handleClick = () => {
        if (portaledChannelId === currentChannelId) {
            toggleVisible();
        } else {
            setChannelId(currentChannelId);
            usePortalStore.getState().setIsVisible(true);
        }
    };

    const isSelected = isVisible && portaledChannelId === currentChannelId;

    return (
        <HeaderBarIcon
            className="vc-portal-btn"
            onClick={handleClick}
            tooltip={isSelected ? "Close Portal" : "Portal this Channel"}
            icon={PortalIcon}
            selected={isSelected}
        />
    );
}

export default definePlugin({
    name: "Portal",
    description: "Pin a channel to a persistent floating window for easy monitoring and quick interaction while you browse other channels.",
    authors: [Devs.nin0dev],

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
                {children}
                <ErrorBoundary key="vc-portal" noop>
                    <PortalToggleButton />
                    <PortalWindow />
                </ErrorBoundary>
            </>
        );
    }
});
