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
import { DeleteIcon, RightArrow as PlayIcon } from "@components/Icons";
import { Button, React, ScrollerThin, Text, TextInput } from "@webpack/common";

import { deleteMacro, Macro,playMacro, settings, useMacroState } from "./store";

export function MacroPopout({ close }: { close: () => void; }) {
    const { macros } = settings.use(["macros"]);
    const { isRecording, startRecording, stopRecording, recordingMacroName, recordedMessages } = useMacroState();
    const [newName, setNewName] = React.useState("");

    return (
        <div className="vc-macros-popout">
            <Flex flexDirection="row" justifyContent="space-between" alignItems="center" className="vc-macros-header">
                <Text variant="heading-md/bold">Message Macros</Text>
            </Flex>

            <ScrollerThin className="vc-macros-list">
                {macros.length === 0 && !isRecording && (
                    <Flex justifyContent="center" alignItems="center" style={{ padding: "20px" }}>
                        <Text variant="text-sm/medium" color="text-muted">No macros saved</Text>
                    </Flex>
                )}

                {macros.map(macro => (
                    <MacroItem key={macro.id} macro={macro} close={close} />
                ))}

                {isRecording && (
                    <div className="vc-macros-item recording">
                        <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Flex flexDirection="row" alignItems="center" gap="8px">
                                <div className="vc-macros-recording-dot" />
                                <Text variant="text-sm/bold">{recordingMacroName || "Recording..."}</Text>
                            </Flex>
                            <Text variant="text-xs/normal" color="text-muted">{recordedMessages.length} msgs</Text>
                        </Flex>
                    </div>
                )}
            </ScrollerThin>

            <div className="vc-macros-record-bar">
                {isRecording ? (
                    <Button
                        color={Button.Colors.RED}
                        size={Button.Sizes.SMALL}
                        onClick={() => stopRecording()}
                        look={Button.Looks.FILLED}
                        style={{ width: "100%" }}
                    >
                        <Flex flexDirection="row" alignItems="center" justifyContent="center" gap="4px">
                            <StopIcon width={16} height={16} />
                            Stop Recording
                        </Flex>
                    </Button>
                ) : (
                    <Flex flexDirection="row" gap="8px" style={{ width: "100%" }}>
                        <TextInput
                            placeholder="Macro Name..."
                            value={newName}
                            onChange={(v: string) => setNewName(v)}
                        />
                        <div
                            className="vc-macros-action-btn"
                            onClick={() => {
                                startRecording(newName);
                                setNewName("");
                            }}
                            title="Record Macro"
                        >
                            <RecordIcon width={24} height={24} color="var(--status-danger)" />
                        </div>
                    </Flex>
                )}
            </div>
        </div>
    );
}

function StopIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" width={16} height={16} {...props}>
            <path fill="currentColor" d="M6 6h12v12H6z" />
        </svg>
    );
}

function RecordIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} {...props}>
            <circle cx="12" cy="12" r="8" fill="currentColor" />
        </svg>
    );
}

function MacroItem({ macro, close }: { macro: Macro; close: () => void; }) {
    return (
        <div className="vc-macros-item">
            <div className="vc-macros-item-header">
                <Text variant="text-sm/bold">{macro.name}</Text>
                <div className="vc-macros-item-actions">
                    <div
                        className="vc-macros-action-btn"
                        onClick={() => {
                            playMacro(macro);
                            close();
                        }}
                        title="Play"
                    >
                        <PlayIcon width={16} height={16} />
                    </div>
                    <div
                        className="vc-macros-action-btn"
                        onClick={() => deleteMacro(macro.id)}
                        title="Delete"
                    >
                        <DeleteIcon width={16} height={16} />
                    </div>
                </div>
            </div>
            <Text variant="text-xs/normal" color="text-muted">
                {macro.messages.length} messages
            </Text>
        </div>
    );
}
