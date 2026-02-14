import React from 'react';
import { Box, Text } from 'ink';
import { type GameState } from '../types/index.js';

type Props = {
    state: GameState;
};

export default function Header({ state }: Props) {
    const timeString = `${state.day}日目 ${state.hour}:${state.minute.toString().padStart(2, '0')}`;

    return (
        <Box justifyContent="space-between" marginY={1} paddingX={1} width={60}>
            <Text bold color="yellow">Merchant Game</Text>
            <Text bold>{timeString}</Text>
        </Box>
    );
}
