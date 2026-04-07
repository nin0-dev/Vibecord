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

import { findComponentByCodeLazy } from "@webpack";
import { Clickable, MessageActions, Popout, React, SelectedChannelStore, useRef, useState, useStateFromStores } from "@webpack/common";

import { removeWaypoint, settings, Waypoint } from "./store";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

function WaypointIcon() {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24}>
            <path
                fill="currentColor"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
        </svg>
    );
}

function WaypointItem({ waypoint, close }: { waypoint: Waypoint; close: () => void; }) {
    const jump = (e: React.MouseEvent) => {
        e.stopPropagation();
        MessageActions.jumpToMessage({
            channelId: waypoint.channelId,
            messageId: waypoint.messageId,
            flash: true,
            jumpType: "INSTANT"
        });
        close();
    };

    const remove = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeWaypoint(waypoint.id);
    };

    return (
        <Clickable className="vc-waypoints-item" onClick={jump}>
            <div className="vc-waypoints-item-header">
                <span className="vc-waypoints-item-author">{waypoint.author}</span>
                <Clickable className="vc-waypoints-item-remove" onClick={remove}>
                    <svg viewBox="0 0 24 24" width={16} height={16}>
                        <path
                            fill="currentColor"
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                    </svg>
                </Clickable>
            </div>
            <div className="vc-waypoints-item-content">
                {waypoint.content || "(No content)"}
            </div>
        </Clickable>
    );
}

function WaypointPopout({ close }: { close: () => void; }) {
    const waypoints = useStateFromStores([settings.store], () => settings.store.waypoints);
    const currentChannelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getChannelId());
    const [filterCurrent, setFilterCurrent] = useState(true);

    const filtered = filterCurrent
        ? waypoints.filter(w => w.channelId === currentChannelId)
        : waypoints;

    return (
        <div className="vc-waypoints-popout">
            <div className="vc-waypoints-header">
                <span className="vc-waypoints-title">Waypoints</span>
                <Clickable
                    onClick={() => setFilterCurrent(!filterCurrent)}
                    style={{ color: "var(--text-link)", fontSize: "12px" }}
                >
                    {filterCurrent ? "Show All" : "Show Current Only"}
                </Clickable>
            </div>
            <div className="vc-waypoints-list">
                {filtered.length > 0 ? (
                    filtered.map(w => (
                        <WaypointItem key={w.id} waypoint={w} close={close} />
                    ))
                ) : (
                    <div className="vc-waypoints-empty">
                        No waypoints {filterCurrent ? "in this channel" : "yet"}.
                    </div>
                )}
            </div>
        </div>
    );
}

export function WaypointButton() {
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
            renderPopout={() => <WaypointPopout close={() => setShow(false)} />}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className="vc-waypoints-btn"
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "Waypoints"}
                    icon={() => <WaypointIcon />}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}
