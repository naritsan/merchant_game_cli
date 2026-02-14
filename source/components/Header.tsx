import React from 'react';
import { Box, Text } from 'ink';
import { type GameState, type Weather, type DayOfWeek, type Luck } from '../types/index.js';

type Props = {
    state: GameState;
};

const getWeatherIcon = (weather: Weather): { icon: string; color: string } => {
    switch (weather) {
        case 'sunny': return { icon: '☀', color: 'yellow' };
        case 'rainy': return { icon: '☂', color: 'blue' };
        case 'snowy': return { icon: '☃', color: 'white' };
        case 'storm': return { icon: '⛈', color: 'red' };
        case 'aurora': return { icon: '🌌', color: 'magenta' };
        default: return { icon: '?', color: 'gray' };
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

export default function Header({ state }: Props) {
    const dayLabel = getDayLabel(state.dayOfWeek);
    const timeString = `${state.day}日目(${dayLabel}) ${state.hour}:${state.minute.toString().padStart(2, '0')}`;
    const weatherInfo = getWeatherIcon(state.weather);
    const luckInfo = state.isLuckRevealed ? getLuckLabel(state.luck) : { label: '?', color: 'gray' };

    return (
        <Box justifyContent="space-between" marginY={1} paddingX={1} width={60}>
            <Text bold color="yellow">Merchant Game</Text>
            <Box>
                <Text bold>{timeString}</Text>
                <Text> </Text>
                <Text color={weatherInfo.color}>{weatherInfo.icon}</Text>
                <Text> </Text>
                <Text>[</Text>
                <Text color={luckInfo.color}>{luckInfo.label}</Text>
                <Text>]</Text>
            </Box>
        </Box>
    );
}
