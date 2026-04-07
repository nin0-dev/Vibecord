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
import { Popout, React, useRef, UserStore,useState } from "@webpack/common";
import type { PropsWithChildren } from "react";

import { EchoTrailPopout } from "./EchoTrailPopout";
import { addChannelToHistory, addInteractionToHistory, addMessageToHistory, settings } from "./store";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function TrailIcon() {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.53.85-1.07-3.63-2.16V8h-1.5z" />
        </svg>
    );
}

function EchoTrailButton() {
    const buttonRef = useRef(null);
    const [show, setShow] = useState(false);

    return (
        <Popout
            position="bottom"
            align="right"
            animation={Popout.Animation.NONE}
            shouldShow={show}
            onRequestClose={() => setShow(false)}
            targetElementRef={buttonRef}
            renderPopout={() => <EchoTrailPopout close={() => setShow(false)} />}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className="vc-echo-trail-btn"
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "EchoTrail"}
                    icon={() => <TrailIcon />}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}

export default definePlugin({
    name: "EchoTrail",
    description: "Your digital breadcrumbs. Tracks your recent navigation and activity so you can quickly jump back.",
    authors: [Devs.nin0dev],
    settings,

    flux: {
        CHANNEL_SELECT: ({ channelId }) => {
            if (channelId) addChannelToHistory(channelId);
        },
        MESSAGE_CREATE: ({ message }) => {
            if (message.author?.id === UserStore.getCurrentUser()?.id) {
                addMessageToHistory({
                    id: message.id,
                    channelId: message.channel_id,
                    content: message.content,
                    author: message.author.username
                });
            }
        },
        MESSAGE_REACTION_ADD: ({ channelId, messageId, emoji, userId }) => {
            if (userId === UserStore.getCurrentUser()?.id) {
                addInteractionToHistory({
                    channelId,
                    messageId,
                    type: "reaction",
                    details: emoji.name
                });
            }
        }
    },

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
                <ErrorBoundary key="vc-echo-trail" noop>
                    <EchoTrailButton />
                </ErrorBoundary>
            </>
        );
    },
});
