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

import { Flex } from "@components/Flex";
import { MessageActions, Parser, React, ScrollerThin } from "@webpack/common";

import { Portal, useApertureStore } from "./store";

function AperturePortal({ portal }: { portal: Portal; }) {
    const { removePortal, updatePortalPosition } = useApertureStore();
    const [isDragging, setIsDragging] = React.useState(false);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setOffset({
            x: e.clientX - portal.x,
            y: e.clientY - portal.y
        });
    };

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            updatePortalPosition(portal.id, e.clientX - offset.x, e.clientY - offset.y);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, offset, portal.id, updatePortalPosition]);

    const jumpTo = () => {
        MessageActions.jumpToMessage({
            channelId: portal.channelId,
            messageId: portal.messageId,
            flash: true
        });
    };

    return (
        <div
            className="vc-aperture-portal"
            style={{
                left: portal.x,
                top: portal.y,
                position: "fixed",
                zIndex: 1000,
                pointerEvents: "auto"
            }}
        >
            <div className="vc-aperture-header" onMouseDown={handleMouseDown}>
                <Flex justify={Flex.Justify.BETWEEN} align={Flex.Align.CENTER}>
                    <span className="vc-aperture-author">{portal.author.globalName ?? portal.author.username}</span>
                    <Flex gap={4}>
                        <div className="vc-aperture-btn jump" onClick={jumpTo} title="Jump to Message">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </div>
                        <div className="vc-aperture-btn close" onClick={() => removePortal(portal.id)} title="Close">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </div>
                    </Flex>
                </Flex>
            </div>
            <ScrollerThin className="vc-aperture-content">
                {Parser.parse(portal.content, true, { channelId: portal.channelId })}
            </ScrollerThin>
        </div>
    );
}

export function ApertureLayer() {
    const { portals } = useApertureStore();

    if (portals.length === 0) return null;

    return (
        <div className="vc-aperture-layer" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1000 }}>
            {portals.map(portal => (
                <AperturePortal key={portal.id} portal={portal} />
            ))}
        </div>
    );
}
