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
import { DeleteIcon } from "@components/Icons";
import { classes } from "@utils/misc";
import { ChannelRouter, ChannelStore, MessageActions, React, ScrollerThin, Text } from "@webpack/common";

import { clearHistory, settings } from "./store";

type Tab = "channels" | "messages" | "interactions";

export function EchoTrailPopout({ close }: { close: () => void; }) {
    const [activeTab, setActiveTab] = React.useState<Tab>("channels");
    const history = settings.use([activeTab]);

    const items = history[activeTab];

    return (
        <div className="vc-echo-trail-popout">
            <div className="vc-echo-trail-header">
                <Text variant="heading-md/bold">EchoTrail</Text>
                <div className="vc-echo-trail-clear" onClick={() => clearHistory(activeTab)} title="Clear current tab">
                    <DeleteIcon width={16} height={16} />
                </div>
            </div>

            <Flex flexDirection="row" gap="0" className="vc-echo-trail-tabs">
                <TabItem label="Channels" active={activeTab === "channels"} onClick={() => setActiveTab("channels")} />
                <TabItem label="Messages" active={activeTab === "messages"} onClick={() => setActiveTab("messages")} />
                <TabItem label="Interactions" active={activeTab === "interactions"} onClick={() => setActiveTab("interactions")} />
            </Flex>

            <ScrollerThin className="vc-echo-trail-list">
                {items.length === 0 ? (
                    <Flex justifyContent="center" alignItems="center" className="vc-echo-trail-empty">
                        <Text variant="text-sm/medium" color="text-muted">No history yet</Text>
                    </Flex>
                ) : (
                    items.map((item: any, i: number) => (
                        <HistoryItem key={i} item={item} type={activeTab} close={close} />
                    ))
                )}
            </ScrollerThin>
        </div>
    );
}

function TabItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void; }) {
    return (
        <div
            className={classes("vc-echo-trail-tab", active && "active")}
            onClick={onClick}
        >
            <Text variant="text-xs/semibold">{label}</Text>
        </div>
    );
}

function HistoryItem({ item, type, close }: { item: any; type: Tab; close: () => void; }) {
    const handleClick = () => {
        if (type === "channels") {
            ChannelRouter.transitionToChannel(item.id);
        } else {
            MessageActions.jumpToMessage({
                channelId: item.channelId,
                messageId: item.id || item.messageId,
                flash: true,
                jumpType: "INSTANT"
            });
        }
        close();
    };

    const getTitle = () => {
        if (type === "channels") {
            const channel = ChannelStore.getChannel(item.id);
            return channel ? (channel.isDM() ? "Direct Message" : `#${channel.name}`) : "Unknown Channel";
        }
        if (type === "messages") return item.content;
        return `${item.type}: ${item.details}`;
    };

    const getSubtitle = () => {
        const date = new Date(item.timestamp).toLocaleTimeString();
        if (type === "channels") return `Last visited ${date}`;
        return date;
    };

    return (
        <div className="vc-echo-trail-item" onClick={handleClick}>
            <Text variant="text-sm/medium" className="vc-echo-trail-item-title" color="header-primary">
                {getTitle()}
            </Text>
            <Text variant="text-xxs/normal" color="text-muted">
                {getSubtitle()}
            </Text>
        </div>
    );
}
