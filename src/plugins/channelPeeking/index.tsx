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

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Popout, React, useRef, useState } from "@webpack/common";

import { PeekPopout } from "./PeekPopout";

const settings = definePluginSettings({
    trigger: {
        type: OptionType.SELECT,
        description: "How to trigger the peek popout",
        options: [
            { label: "Long Press", value: "longpress", default: true },
            { label: "Shift + Hover", value: "shifthover" }
        ]
    }
});

function ChannelPeekWrapper({ channel, children }: { channel: any; children: React.ReactNode; }) {
    const [show, setShow] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);

    const onMouseEnter = (e: React.MouseEvent) => {
        if (settings.store.trigger === "shifthover") {
            if (e.shiftKey) {
                setShow(true);
            }
        } else {
            timeoutRef.current = window.setTimeout(() => {
                setShow(true);
            }, 600);
        }
    };

    const onMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setShow(false);
    };

    return (
        <Popout
            shouldShow={show}
            onRequestClose={() => setShow(false)}
            position="right"
            align="left"
            animation={Popout.Animation.TRANSLATE}
            renderPopout={() => (
                <ErrorBoundary noop>
                    <PeekPopout channelId={channel.id} channelName={channel.name} />
                </ErrorBoundary>
            )}
            targetElementRef={containerRef}
        >
            {() => (
                <div
                    ref={containerRef}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    style={{ display: "contents" }}
                >
                    {children}
                </div>
            )}
        </Popout>
    );
}

export default definePlugin({
    name: "ChannelPeeking",
    description: "Allows you to peek into a channel's recent messages by hovering or long-pressing in the sidebar.",
    authors: [Devs.nin0dev],
    settings,

    patches: [
        {
            find: "UNREAD_IMPORTANT:",
            replacement: {
                match: /return\s+(\i)\.Children\.count\(\i\)>0\?(\i):null/g,
                replace: (m, _count, original) => {
                    // We want to wrap the whole channel item.
                    // The original usually looks like (some react element)
                    return `return $self.ChannelPeekWrapper(arguments[0], ${original})`;
                }
            }
        }
    ],

    ChannelPeekWrapper: (props: any, original: React.ReactNode) => {
        const { channel } = props;
        if (!channel || channel.type === 4) return original; // Skip categories

        return (
            <ErrorBoundary noop>
                <ChannelPeekWrapper channel={channel}>
                    {original}
                </ChannelPeekWrapper>
            </ErrorBoundary>
        );
    }
});
