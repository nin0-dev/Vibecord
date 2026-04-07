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

import "./styles.css";

import ErrorBoundary from "@components/ErrorBoundary";
import { Microphone } from "@components/Icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Channel, VoiceState } from "@vencord/discord-types";
import {
    Constants,
    PermissionsBits,
    PermissionStore,
    RestAPI,
    Tooltip,
    UserStore,
    useStateFromStores,
    VoiceStateStore
} from "@webpack/common";

export default definePlugin({
    name: "VoiceActions",
    description: "Adds quick actions to the voice connection panel to mute, deafen, or disconnect all users in the channel.",
    authors: [Devs.nin0dev],

    patches: [
        {
            find: "renderConnectionStatus(){",
            replacement: {
                match: /(lineClamp:1,children:)(\i)(?=,|}\))/,
                replace: "$1[$2,$self.renderActions(this.props.channel)]"
            }
        }
    ],

    renderActions(channel: Channel) {
        return (
            <ErrorBoundary noop>
                <this.Actions channel={channel} />
            </ErrorBoundary>
        );
    },

    Actions({ channel }: { channel: Channel; }) {
        const guildId = channel.guild_id;
        if (!guildId) return null;

        const { canMute, canDeafen, canMove } = useStateFromStores([PermissionStore], () => ({
            canMute: PermissionStore.can(PermissionsBits.MUTE_MEMBERS, channel),
            canDeafen: PermissionStore.can(PermissionsBits.DEAFEN_MEMBERS, channel),
            canMove: PermissionStore.can(PermissionsBits.MOVE_MEMBERS, channel)
        }));

        const voiceStates = useStateFromStores([VoiceStateStore], () =>
            VoiceStateStore.getVoiceStatesForChannel(channel.id) as Record<string, VoiceState>
        );

        const currentUserId = UserStore.getCurrentUser()?.id;
        const otherUsers = Object.keys(voiceStates).filter(id => id !== currentUserId);

        if (otherUsers.length === 0) return null;

        const anyUnmuted = otherUsers.some(id => !voiceStates[id].mute);
        const anyUndeafened = otherUsers.some(id => !voiceStates[id].deaf);

        const toggleMuteAll = () => {
            const mute = anyUnmuted;
            for (const userId of otherUsers) {
                if (voiceStates[userId].mute !== mute) {
                    RestAPI.patch({
                        url: Constants.Endpoints.GUILD_MEMBER(guildId, userId),
                        body: { mute }
                    });
                }
            }
        };

        const toggleDeafenAll = () => {
            const deaf = anyUndeafened;
            for (const userId of otherUsers) {
                if (voiceStates[userId].deaf !== deaf) {
                    RestAPI.patch({
                        url: Constants.Endpoints.GUILD_MEMBER(guildId, userId),
                        body: { deaf }
                    });
                }
            }
        };

        const disconnectAll = () => {
            for (const userId of otherUsers) {
                RestAPI.patch({
                    url: Constants.Endpoints.GUILD_MEMBER(guildId, userId),
                    body: { channel_id: null }
                });
            }
        };

        return (
            <div className="vc-va-container">
                {canMute && (
                    <Tooltip text={anyUnmuted ? "Mute All" : "Unmute All"}>
                        {props => (
                            <div {...props} onClick={toggleMuteAll} className="vc-va-button">
                                <Microphone width={16} height={16} />
                            </div>
                        )}
                    </Tooltip>
                )}
                {canDeafen && (
                    <Tooltip text={anyUndeafened ? "Deafen All" : "Undeafen All"}>
                        {props => (
                            <div {...props} onClick={toggleDeafenAll} className="vc-va-button">
                                <DeafenIcon />
                            </div>
                        )}
                    </Tooltip>
                )}
                {canMove && (
                    <Tooltip text="Disconnect All">
                        {props => (
                            <div {...props} onClick={disconnectAll} className="vc-va-button">
                                <DisconnectIcon />
                            </div>
                        )}
                    </Tooltip>
                )}
            </div>
        );
    }
});

function DeafenIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h2v-7H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-2v7h2c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z"/>
        </svg>
    );
}

function DisconnectIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" />
        </svg>
    );
}
