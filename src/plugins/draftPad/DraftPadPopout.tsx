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

import { Heading } from "@components/Heading";
import { copyWithToast, insertTextIntoChatInputBox, sendMessage } from "@utils/discord";
import { Parser, React, SelectedChannelStore, TextArea, Tooltip, useStateFromStores } from "@webpack/common";

import { addSheet, deleteSheet, renameSheet, settings, updateSheet } from "./store";

function PlusIcon() {
    return (
        <svg viewBox="0 0 24 24" width={16} height={16}>
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg viewBox="0 0 24 24" width={16} height={16}>
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
    );
}

function CopyIcon() {
    return (
        <svg viewBox="0 0 24 24" width={16} height={16}>
            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
        </svg>
    );
}

function SendIcon() {
    return (
        <svg viewBox="0 0 24 24" width={16} height={16}>
            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
    );
}

function InsertIcon() {
    return (
        <svg viewBox="0 0 24 24" width={16} height={16}>
            <path fill="currentColor" d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
        </svg>
    );
}

export function DraftPadPopout({ close }: { close: () => void; }) {
    const { sheets, activeSheetId } = settings.use();
    const activeSheet = sheets.find(s => s.id === activeSheetId) ?? sheets[0];
    const channelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getChannelId());

    const wordCount = activeSheet.content.trim() ? activeSheet.content.trim().split(/\s+/).length : 0;
    const charCount = activeSheet.content.length;

    const handleSend = () => {
        if (channelId && activeSheet.content.trim()) {
            sendMessage(channelId, { content: activeSheet.content });
            close();
        }
    };

    return (
        <div className="vc-draftpad-popout">
            <div className="vc-draftpad-header">
                <Heading tag="h3">DraftPad</Heading>
                <div className="vc-draftpad-btn-icon" onClick={addSheet}>
                    <PlusIcon />
                </div>
            </div>

            <div className="vc-draftpad-tabs">
                {sheets.map(sheet => (
                    <div
                        key={sheet.id}
                        className={`vc-draftpad-tab ${sheet.id === activeSheetId ? "active" : ""}`}
                        onClick={() => (settings.store.activeSheetId = sheet.id)}
                        onContextMenu={e => {
                            e.preventDefault();
                            const newTitle = prompt("Rename Draft", sheet.title);
                            if (newTitle) renameSheet(sheet.id, newTitle);
                        }}
                    >
                        <span className="vc-draftpad-tab-name">{sheet.title}</span>
                        {sheets.length > 1 && (
                            <div
                                className="vc-draftpad-btn-icon danger"
                                onClick={e => {
                                    e.stopPropagation();
                                    deleteSheet(sheet.id);
                                }}
                            >
                                <TrashIcon />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="vc-draftpad-content">
                <div className="vc-draftpad-editor-wrap">
                    <TextArea
                        className="vc-draftpad-editor"
                        value={activeSheet.content}
                        onChange={(val: string) => updateSheet(activeSheet.id, val)}
                        placeholder="Start typing your masterpiece..."
                        autoFocus
                    />
                </div>

                {activeSheet.content.trim() && (
                    <div className="vc-draftpad-preview">
                        <Heading tag="h5" style={{ marginBottom: "4px", opacity: 0.6 }}>Preview</Heading>
                        <div className="vc-draftpad-preview-inner">
                            {Parser.parse(activeSheet.content, true, { channelId })}
                        </div>
                    </div>
                )}
            </div>

            <div className="vc-draftpad-footer">
                <div className="vc-draftpad-footer-left">
                    <span>{wordCount} words</span>
                    <span>{charCount} chars</span>
                </div>
                <div className="vc-draftpad-footer-right">
                    <Tooltip text="Copy to Clipboard">
                        {props => (
                            <div {...props} className="vc-draftpad-btn-icon" onClick={() => copyWithToast(activeSheet.content)}>
                                <CopyIcon />
                            </div>
                        )}
                    </Tooltip>
                    <Tooltip text="Insert into Chat">
                        {props => (
                            <div {...props} className="vc-draftpad-btn-icon" onClick={() => { insertTextIntoChatInputBox(activeSheet.content); close(); }}>
                                <InsertIcon />
                            </div>
                        )}
                    </Tooltip>
                    <Tooltip text="Send to Current Channel">
                        {props => (
                            <div {...props} className="vc-draftpad-btn-icon" onClick={handleSend}>
                                <SendIcon />
                            </div>
                        )}
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}
