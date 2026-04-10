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
import { FluxDispatcher, Popout, React, useRef, useState } from "@webpack/common";
import type { PropsWithChildren } from "react";

import { MacroPopout } from "./MacroPopout";
import { settings, useMacroState } from "./store";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function MacroIcon() {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="vc-macros-icon">
            <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
            />
        </svg>
    );
}

function MacroButton() {
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
            renderPopout={() => <MacroPopout close={() => setShow(false)} />}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className="vc-macros-btn"
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "Message Macros"}
                    icon={MacroIcon}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}

export default definePlugin({
    name: "MessageMacros",
    description: "Record and replay sequences of messages.",
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
                {children}
                <ErrorBoundary key="vc-message-macros" noop>
                    <MacroButton />
                </ErrorBoundary>
            </>
        );
    },

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", this.onMessageCreate);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", this.onMessageCreate);
    },

    onMessageCreate({ message }: any) {
        const state = useMacroState.getState();
        if (!state.isRecording) return;

        // Check if the message is from the current user
        const { UserStore } = Vencord.Webpack.Common;
        if (message.author.id !== UserStore.getCurrentUser().id) return;

        state.addRecordedMessage(message.content);
    }
});
