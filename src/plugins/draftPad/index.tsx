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
import { Popout, React, useRef, useState } from "@webpack/common";
import type { PropsWithChildren } from "react";

import { DraftPadPopout } from "./DraftPadPopout";
import { settings } from "./store";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function DraftPadIcon() {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24}>
            <path
                fill="currentColor"
                d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
            />
        </svg>
    );
}

function DraftPadButton() {
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
            renderPopout={() => <DraftPadPopout close={() => setShow(false)} />}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className="vc-draftpad-btn"
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "DraftPad"}
                    icon={DraftPadIcon}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}

export default definePlugin({
    name: "DraftPad",
    description: "A scratchpad for brainstorming and composing multi-part messages or templates without cluttering your chat input.",
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
                <ErrorBoundary key="vc-draftpad" noop>
                    <DraftPadButton />
                </ErrorBoundary>
            </>
        );
    }
});
