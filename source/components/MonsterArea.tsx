import React from 'react';
import { Box, Text } from 'ink';
import type { Monster } from '../types/index.js';

type Props = {
    monster: Monster;
};

function hpBar(current: number, max: number, length = 20): string {
    const filled = Math.round((current / max) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

export default function MonsterArea({ monster }: Props) {
    const hpRatio = monster.hp / monster.maxHp;
    let hpColor: string = 'green';
    if (hpRatio <= 0.25) {
        hpColor = 'red';
    } else if (hpRatio <= 0.5) {
        hpColor = 'yellow';
    }

    return (
        <Box flexDirection="column" alignItems="center" paddingY={1}>
            <Text>{monster.name}</Text>
            <Text> </Text>
            <Box>
                <Text>HP </Text>
                <Text color={hpColor}>{hpBar(monster.hp, monster.maxHp)}</Text>
                <Text> {monster.hp}/{monster.maxHp}</Text>
            </Box>
        </Box>
    );
}
