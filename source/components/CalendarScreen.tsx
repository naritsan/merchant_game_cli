import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import { type GameState, type DayOfWeek, DAYS_OF_WEEK } from '../types/index.js';

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
    // 現在の月（30日周期）の何日目か
    // ゲーム開始時は1日目(月曜)
    // 30日周期でカレンダーを表示する
    const currentDay = state.day;
    const currentMonth = Math.floor((currentDay - 1) / 30) + 1;
    const dayInMonth = ((currentDay - 1) % 30) + 1;

    // カレンダーグリッドの作成
    // 1日目が月曜日なので、日曜始まりのカレンダーではオフセットは1
    const startDayOffset = 1;
    const daysInMonth = 30;

    // カーソル位置（初期位置は今日）
    const [cursorDay, setCursorDay] = useState(dayInMonth);

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

    const getDayOfWeekForDate = (date: number): DayOfWeek => {
        // 1日目が月曜日(Index 0 of DAYS_OF_WEEK)
        // (date - 1) % 7 がDAYS_OF_WEEKのIndex
        return DAYS_OF_WEEK[(date - 1) % 7]!;
    };

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
                    const isToday = day === dayInMonth;
                    const isCursor = day === cursorDay;
                    const dayOfWeek = day ? getDayOfWeekForDate(day) : undefined;
                    const isSunday = dayOfWeek === 'Sunday';

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

    const cursorDayOfWeek = getDayOfWeekForDate(cursorDay);
    const cursorDescription = getDayEventDescription(cursorDayOfWeek);

    return (
        <Box flexDirection="column" width={60}>
            <BorderBox>
                <Box flexDirection="column" paddingX={1}>
                    <Box justifyContent="center" marginBottom={1}>
                        <Text bold color="yellow">=== {currentMonth}ヶ月目 ===</Text>
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
                        {cursorDay === dayInMonth && <Text color="green">★ 今日</Text>}
                    </Box>

                </Box>
            </BorderBox>
            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>矢印キー: 移動  Enter/Esc: 戻る</Text>
            </Box>
        </Box>
    );
}
