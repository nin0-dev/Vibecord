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

import {
    MessageActions,
    React,
    SelectedChannelStore,
    SnowflakeUtils,
    Text,
    useMemo,
    useState,
    useStateFromStores
} from "@webpack/common";

import { settings } from "./index";

export function ChronosPopout({ close }: { close: () => void; }) {
    const channelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getChannelId());
    const [viewDate, setViewDate] = useState(new Date());

    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();

    const days = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startOffset = (firstDayOfMonth.getDay() - (settings.store.mondayStart ? 1 : 0) + 7) % 7;

        const calendarDays: Array<{ day: number; month: number; year: number; outside: boolean; }> = [];

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            calendarDays.push({
                day: prevMonthLastDay - i,
                month: month - 1,
                year,
                outside: true
            });
        }

        // Current month days
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            calendarDays.push({
                day: i,
                month,
                year,
                outside: false
            });
        }

        // Next month days
        const endOffset = (7 - (calendarDays.length % 7)) % 7;
        for (let i = 1; i <= endOffset; i++) {
            calendarDays.push({
                day: i,
                month: month + 1,
                year,
                outside: true
            });
        }

        return calendarDays;
    }, [month, year, settings.store.mondayStart]);

    const handleJump = (day: number, m: number, y: number) => {
        if (!channelId) return;
        const targetDate = new Date(y, m, day);
        const snowflake = SnowflakeUtils.fromTimestamp(targetDate.getTime());
        MessageActions.jumpToMessage({
            channelId,
            messageId: snowflake,
            flash: true
        });
        close();
    };

    const changeMonth = (offset: number) => {
        setViewDate(new Date(year, month + offset, 1));
    };

    const weekdays = settings.store.mondayStart
        ? ["M", "T", "W", "T", "F", "S", "S"]
        : ["S", "M", "T", "W", "T", "F", "S"];

    const today = new Date();
    const isToday = (d: number, m: number, y: number) => {
        const date = new Date(y, m, d);
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const monthName = viewDate.toLocaleString("default", { month: "long" });

    return (
        <div className="vc-chronos-popout">
            <div className="vc-chronos-header">
                <Text variant="heading-md/bold">{monthName} {year}</Text>
                <div className="vc-chronos-nav">
                    <div className="vc-chronos-nav-btn" onClick={() => changeMonth(-1)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </div>
                    <div className="vc-chronos-nav-btn" onClick={() => changeMonth(1)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
            </div>
            <div className="vc-chronos-calendar">
                {weekdays.map((wd, i) => (
                    <div key={i} className="vc-chronos-weekday">{wd}</div>
                ))}
                {days.map((d, i) => (
                    <div
                        key={i}
                        className={`vc-chronos-day ${d.outside ? "outside" : ""} ${isToday(d.day, d.month, d.year) ? "today" : ""}`}
                        onClick={() => handleJump(d.day, d.month, d.year)}
                    >
                        {d.day}
                    </div>
                ))}
            </div>
        </div>
    );
}
