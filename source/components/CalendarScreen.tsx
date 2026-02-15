import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import { type GameState, type DayOfWeek, DAYS_OF_WEEK } from '../types/index.js';
import { getGameDate, getDaysInMonth, getSeasonLabel, getSeasonColor, GAME_START_DAY_OFFSET } from '../utils/time.js';

type Props = {
    state: GameState;
    changeScene: (scene: GameState['scene']) => void;
};

const getDayEventDescription = (dayOfWeek: DayOfWeek): string => {
    switch (dayOfWeek) {
        case 'Monday': return '特になし';
        case 'Tuesday': return '武器の需要増 (売上UP)';
        case 'Wednesday': return '道具の需要増 (売上UP)';
        case 'Thursday': return '防具の需要増 (売上UP)';
        case 'Friday': return '客の予算増加 (高額商品チャンス)';
        case 'Saturday': return '客数増加 (薄利多売チャンス)';
        case 'Sunday': return '安息日 (店舗・仕入れ不可)';
        default: return '';
    }
};

const getDayLabel = (day: DayOfWeek): string => {
    switch (day) {
        case 'Monday': return '月';
        case 'Tuesday': return '火';
        case 'Wednesday': return '水';
        case 'Thursday': return '木';
        case 'Friday': return '金';
        case 'Saturday': return '土';
        case 'Sunday': return '日';
        default: return '?';
    }
};

// 表示用の曜日順（日曜始まり）
const DISPLAY_DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CalendarScreen({ state, changeScene }: Props) {
    // 現在の日付情報を取得 (オフセット適用)
    const currentDate = getGameDate(state.day + GAME_START_DAY_OFFSET);

    // 現在の月の日数
    const daysInMonth = getDaysInMonth(currentDate.year, currentDate.month);

    // 月初（1日）の曜日を計算
    // 現在の日（totalDays）から (day - 1) 日引くと、その月の1日のtotalDaysになる
    const firstDayTotalDays = (state.day + GAME_START_DAY_OFFSET) - (currentDate.day - 1);
    const firstDayDate = getGameDate(firstDayTotalDays);

    // DISPLAY_DAYS (日, 月, 火...) におけるインデックスを計算
    // DAYS_OF_WEEK (月, 火, 水...) のインデックスを取得
    const firstDayOfWeekIndex = DAYS_OF_WEEK.indexOf(firstDayDate.dayOfWeek);
    // 月(0) -> 1, 火(1) -> 2, ..., 土(5) -> 6, 日(6) -> 0
    const startDayOffset = (firstDayOfWeekIndex + 1) % 7;

    // カーソル位置（初期位置は今日）
    const [cursorDay, setCursorDay] = useState(currentDate.day);

    // カーソルの曜日を計算
    // 1日の曜日インデックス(0-6, Sunday=0) + (cursorDay - 1)
    // これを7で割った余りがカーソル日の曜日インデックス(0-6, Sunday=0)
    // DISPLAY_DAYS[index] でDayOfWeekが取れる
    const getDayOfWeekForCursor = (day: number): DayOfWeek => {
        const offset = (startDayOffset + (day - 1)) % 7;
        return DISPLAY_DAYS[offset]!;
    };

    useInput((_input, key) => {
        if (key.return || key.escape) {
            changeScene('menu');
        } else if (key.leftArrow) {
            setCursorDay(prev => Math.max(1, prev - 1));
        } else if (key.rightArrow) {
            setCursorDay(prev => Math.min(daysInMonth, prev + 1));
        } else if (key.upArrow) {
            setCursorDay(prev => Math.max(1, prev - 7));
        } else if (key.downArrow) {
            setCursorDay(prev => Math.min(daysInMonth, prev + 7));
        }
    });

    const renderCalendarGrid = () => {
        const rows = [];
        let currentRow = [];

        // 空白セル（開始曜日まで）
        for (let i = 0; i < startDayOffset; i++) {
            currentRow.push(null);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            currentRow.push(d);
            if (currentRow.length === 7) {
                rows.push(currentRow);
                currentRow = [];
            }
        }
        if (currentRow.length > 0) {
            while (currentRow.length < 7) {
                currentRow.push(null);
            }
            rows.push(currentRow);
        }

        return rows.map((row, rowIndex) => (
            <Box key={rowIndex} flexDirection="row">
                {row.map((day, colIndex) => {
                    const isToday = day === currentDate.day;
                    const isCursor = day === cursorDay;

                    // このセルの曜日
                    // colIndex 0 = Sunday
                    const isSunday = colIndex === 0;

                    let cellColor = 'white';
                    if (isToday) cellColor = 'green';
                    else if (isCursor) cellColor = 'cyan';
                    else if (isSunday) cellColor = 'red';
                    else if (!day) cellColor = 'gray';

                    return (
                        <Box key={colIndex} width={4} justifyContent="center">
                            <Text
                                color={cellColor}
                                bold={isToday || isCursor}
                                underline={isCursor}
                                backgroundColor={isCursor ? 'blue' : undefined}
                            >
                                {day ? day.toString().padStart(2, ' ') : '  '}
                            </Text>
                        </Box>
                    );
                })}
            </Box>
        ));
    };

    const cursorDayOfWeek = getDayOfWeekForCursor(cursorDay);
    const cursorDescription = getDayEventDescription(cursorDayOfWeek);
    const seasonLabel = getSeasonLabel(currentDate.season);
    const seasonColor = getSeasonColor(currentDate.season);

    return (
        <Box flexDirection="column" width={60}>
            <BorderBox>
                <Box flexDirection="column" paddingX={1}>
                    <Box justifyContent="center" marginBottom={1}>
                        <Text bold color="yellow">=== {currentDate.year}年 {currentDate.month}月 (</Text>
                        <Text bold backgroundColor={seasonColor} color="black"> {seasonLabel} </Text>
                        <Text bold color="yellow">) ===</Text>
                    </Box>

                    {/* Header Row */}
                    <Box flexDirection="row" borderStyle="single" borderBottom={false} borderTop={false} borderLeft={false} borderRight={false}>
                        {DISPLAY_DAYS.map(d => (
                            <Box key={d} width={4} justifyContent="center">
                                <Text color={d === 'Sunday' ? 'red' : 'white'}>
                                    {getDayLabel(d)}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                    <Text>----------------------------</Text>

                    {/* Grid */}
                    {renderCalendarGrid()}

                    <Text> </Text>
                    <Text>----------------------------</Text>
                    <Box marginTop={1}>
                        <Text>
                            <Text bold color="cyan">[{cursorDay}日 ({getDayLabel(cursorDayOfWeek)})]</Text>
                            : {cursorDescription}
                        </Text>
                    </Box>
                    <Box marginTop={0}>
                        {cursorDay === currentDate.day && <Text color="green">★ 今日</Text>}
                    </Box>

                </Box>
            </BorderBox>
            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>矢印キー: 移動  Enter/Esc: 戻る</Text>
            </Box>
        </Box>
    );
}
