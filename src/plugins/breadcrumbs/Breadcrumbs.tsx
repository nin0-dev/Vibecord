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
import { ChannelRouter, ChannelStore, GuildStore, IconUtils, React, Text, Tooltip, UserStore } from "@webpack/common";

import { settings } from "./store";

export function Breadcrumbs() {
    const { history } = settings.use(["history"]);

    // Only show breadcrumbs for previously visited channels (skip current one which is at index 0)
    const breadcrumbs = history.slice(1);

    if (breadcrumbs.length === 0) return null;

    return (
        <Flex flexDirection="row" alignItems="center" className="vc-breadcrumbs-container">
            {breadcrumbs.map((entry, index) => (
                <React.Fragment key={entry.channelId}>
                    <BreadcrumbItem channelId={entry.channelId} />
                    {index < breadcrumbs.length - 1 && (
                        <Text variant="text-xs/normal" color="text-muted" className="vc-breadcrumbs-separator">/</Text>
                    )}
                </React.Fragment>
            ))}
        </Flex>
    );
}

function BreadcrumbItem({ channelId }: { channelId: string; }) {
    const channel = ChannelStore.getChannel(channelId);
    if (!channel) return null;

    let { name } = channel;
    let iconUrl = "";
    let serverName = "";

    if (channel.isDM()) {
        const user = UserStore.getUser(channel.recipients?.[0]);
        name = user?.globalName ?? user?.username ?? "Direct Message";
        iconUrl = IconUtils.getUserAvatarURL(user) ?? "";
    } else if (channel.isGroupDM()) {
        name = channel.name ?? "Group DM";
        iconUrl = IconUtils.getChannelIconURL(channel) ?? "";
    } else {
        const guild = GuildStore.getGuild(channel.guild_id);
        serverName = guild?.name ?? "";
        iconUrl = IconUtils.getGuildIconURL(guild) ?? "";
    }

    const displayName = name?.length > 15 ? name.substring(0, 12) + "..." : (name ?? "Unknown");
    const tooltipText = serverName ? `${serverName} > #${name}` : (name ?? "Unknown");

    return (
        <Tooltip text={tooltipText}>
            {props => (
                <Flex
                    {...props}
                    flexDirection="row"
                    alignItems="center"
                    className="vc-breadcrumb-item"
                    onClick={() => ChannelRouter.transitionToChannel(channelId)}
                >
                    {iconUrl && <img src={iconUrl} className="vc-breadcrumb-icon" alt="" />}
                    <Text variant="text-xs/medium" color="header-secondary" className="vc-breadcrumb-name">
                        {displayName}
                    </Text>
                </Flex>
            )}
        </Tooltip>
    );
}
