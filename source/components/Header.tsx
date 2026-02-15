import React from 'react';
import { Box, Text } from 'ink';
import { type GameState, type Weather, type DayOfWeek, type Luck } from '../types/index.js';

type Props = {
    state: GameState;
};

const getWeatherInfo = (weather: Weather): { icon: string; label: string; color: string } => {
    switch (weather) {
        case 'sunny': return { icon: '☀', label: '快晴', color: 'yellow' };
        case 'rainy': return { icon: '☂', label: '雨', color: 'blue' };
        case 'snowy': return { icon: '☃', label: '雪', color: 'white' };
        case 'storm': return { icon: '⛈', label: '嵐', color: 'red' };
        case 'aurora': return { icon: '🌌', label: 'オーロラ', color: 'magenta' };
        default: return { icon: '?', label: '不明', color: 'gray' };
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

const getDayColor = (day: DayOfWeek): string => {
    switch (day) {
        case 'Sunday': return 'red';
        case 'Saturday': return 'blue';
        default: return 'white';
    }
};
const getLuckLabel = (luck: Luck): { label: string; color: string } => {
    switch (luck) {
        case 'Divine': return { label: '神の加護', color: 'yellow' };
        case 'Miracle': return { label: '星の導き', color: 'yellow' };
        case 'Blessing': return { label: '女神の祝福', color: 'green' };
        case 'Fortune': return { label: '幸運', color: 'green' };
        case 'Normal': return { label: '平穏', color: 'white' };
        case 'BadOmen': return { label: '不吉な予感', color: 'magenta' };
        case 'Curse': return { label: '呪い', color: 'magenta' };
        case 'Doom': return { label: '破滅の兆し', color: 'red' };
        case 'Apocalypse': return { label: '黙示録', color: 'red' };
        default: return { label: '?', color: 'gray' };
    }
};

import { getGameDate, getSeasonLabel, getSeasonColor, GAME_START_DAY_OFFSET } from '../utils/time.js';

export default function Header({ state }: Props) {
    const dateInfo = getGameDate(state.day + GAME_START_DAY_OFFSET);
    const dayLabel = getDayLabel(dateInfo.dayOfWeek);
    const dayColor = getDayColor(dateInfo.dayOfWeek);
    const seasonLabel = getSeasonLabel(dateInfo.season);
    const seasonColor = getSeasonColor(dateInfo.season);

    const weather = getWeatherInfo(state.weather);
    const luckInfo = state.isLuckRevealed ? getLuckLabel(state.luck) : { label: '?', color: 'gray' };

    return (
        <Box marginY={1} paddingX={1}>
            <Box marginRight={3}>
                <Text bold color="yellow">所持金: {state.gold}G</Text>
            </Box>
            <Box>
                <Text bold>
                    {dateInfo.year}年目 {dateInfo.month}月{dateInfo.day}日<Text color={dayColor}>({dayLabel})</Text>
                </Text>
                <Text> </Text>
                <Text backgroundColor={seasonColor} color="#000000">{seasonLabel}</Text>
                <Text> </Text>
                <Text bold>{state.hour}:{state.minute.toString().padStart(2, '0')}</Text>
                <Text> </Text>
                <Text bold color={weather.color} inverse> {weather.icon} {weather.label} </Text>
                <Text> </Text>
                <Text>[</Text>
                <Text color={luckInfo.color}>{luckInfo.label}</Text>
                <Text>]</Text>
            </Box>
        </Box>
    );
}
