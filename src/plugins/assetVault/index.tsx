/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
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
import { filters, findComponentByCodeLazy } from "@webpack";
import { MessageStore, Popout, SelectedChannelStore, Text, useMemo, useRef, useState, useStateFromStores } from "@webpack/common";
import { waitForComponent } from "@webpack/common/internal";
import type { PropsWithChildren } from "react";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');
const SearchBar = waitForComponent<any>("SearchBar", filters.componentByCode('placeholder:"Search"', "onChange:"));

const linkRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
const codeBlockRegex = /```(\w+\n)?([\s\S]*?)```/g;

export const settings = definePluginSettings({
    showLinks: {
        type: OptionType.BOOLEAN,
        description: "Show links in the vault",
        default: true
    },
    showCodeBlocks: {
        type: OptionType.BOOLEAN,
        description: "Show code blocks in the vault",
        default: true
    },
    showAttachments: {
        type: OptionType.BOOLEAN,
        description: "Show attachments in the vault",
        default: true
    }
});

function VaultPopout() {
    const channelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getChannelId());
    const [search, setSearch] = useState("");

    const messages = useStateFromStores([MessageStore], () => {
        if (!channelId) return [];
        return MessageStore.getMessages(channelId)?.toArray() ?? [];
    });

    const assets = useMemo(() => {
        const links: string[] = [];
        const codeBlocks: string[] = [];
        const attachments: any[] = [];

        messages.forEach(msg => {
            if (settings.store.showLinks && msg.content) {
                const matches = msg.content.match(linkRegex);
                if (matches) {
                    matches.forEach(link => {
                        if (!search || link.toLowerCase().includes(search.toLowerCase())) {
                            links.push(link);
                        }
                    });
                }
            }
            if (settings.store.showCodeBlocks && msg.content) {
                let match;
                while ((match = codeBlockRegex.exec(msg.content)) !== null) {
                    const code = match[2].trim();
                    if (!search || code.toLowerCase().includes(search.toLowerCase())) {
                        codeBlocks.push(code);
                    }
                }
            }
            if (settings.store.showAttachments && msg.attachments?.length) {
                msg.attachments.forEach(attachment => {
                    if (!search || attachment.filename.toLowerCase().includes(search.toLowerCase())) {
                        attachments.push(attachment);
                    }
                });
            }
        });

        return { links, codeBlocks, attachments };
    }, [messages, search]);

    return (
        <div className="vc-asset-vault-popout">
            <div className="vc-asset-vault-header">
                <Text variant="text-md/semibold" color="header-primary">Asset Vault</Text>
            </div>
            <div className="vc-asset-vault-search">
                <SearchBar
                    query={search}
                    onChange={setSearch}
                    onClear={() => setSearch("")}
                    placeholder="Search assets..."
                    size="medium"
                />
            </div>
            <div className="vc-asset-vault-content">
                {assets.links.length === 0 && assets.codeBlocks.length === 0 && assets.attachments.length === 0 && (
                    <div className="vc-asset-vault-empty">
                        <Text variant="text-sm/normal" color="text-muted">No assets found.</Text>
                    </div>
                )}
                {assets.links.length > 0 && (
                    <div className="vc-asset-vault-section">
                        <Text variant="text-xs/bold" color="interactive-normal" className="vc-asset-vault-section-title">Links</Text>
                        {assets.links.map((link, i) => (
                            <div key={i} className="vc-asset-vault-item">
                                <a href={link} target="_blank" rel="noreferrer" className="vc-asset-vault-link">
                                    {link}
                                </a>
                            </div>
                        ))}
                    </div>
                )}
                {assets.attachments.length > 0 && (
                    <div className="vc-asset-vault-section">
                        <Text variant="text-xs/bold" color="interactive-normal" className="vc-asset-vault-section-title">Attachments</Text>
                        {assets.attachments.map((attachment, i) => (
                            <div key={i} className="vc-asset-vault-item">
                                <a href={attachment.url} target="_blank" rel="noreferrer" className="vc-asset-vault-link">
                                    {attachment.filename}
                                </a>
                            </div>
                        ))}
                    </div>
                )}
                {assets.codeBlocks.length > 0 && (
                    <div className="vc-asset-vault-section">
                        <Text variant="text-xs/bold" color="interactive-normal" className="vc-asset-vault-section-title">Code Blocks</Text>
                        {assets.codeBlocks.map((code, i) => (
                            <div key={i} className="vc-asset-vault-item vc-asset-vault-code-item">
                                <pre className="vc-asset-vault-code">{code}</pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function VaultButton() {
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
            renderPopout={() => <VaultPopout />}
        >
            {(_, { isShown }) => (
                <HeaderBarIcon
                    ref={buttonRef}
                    className="vc-asset-vault-btn"
                    onClick={() => setShow(v => !v)}
                    tooltip={isShown ? null : "Asset Vault"}
                    icon={() => (
                        <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                            <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z" />
                        </svg>
                    )}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}

export default definePlugin({
    name: "AssetVault",
    description: "Automatically aggregates and makes searchable all assets shared in a channel (links, code snippets, and files) into a dedicated vault.",
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
                <ErrorBoundary key="vc-asset-vault" noop>
                    <VaultButton />
                </ErrorBoundary>
            </>
        );
    },
});
