import React from 'react';
import { Box, Text } from 'ink';
import type { Character } from '../types/index.js';

type Props = {
    party: Character[];
};

function padName(name: string, length = 6): string {
    const pad = length - [...name].length;
    return name + '　'.repeat(Math.max(0, pad));
}

export default function StatusPanel({ party }: Props) {
    return (
        <Box flexDirection="column" paddingX={1}>
            {party.map(char => {
                const hpRatio = char.hp / char.maxHp;
                let hpColor: string = 'white';
                if (hpRatio <= 0.25) {
                    hpColor = 'red';
                } else if (hpRatio <= 0.5) {
                    hpColor = 'yellow';
                }

                return (
                    <Text key={char.name}>
                        {padName(char.name)}
                        <Text color={hpColor}>
                            HP{String(char.hp).padStart(4, ' ')}/{char.maxHp}
                        </Text>
                        <Text color="cyan">
                            {' '}MP{String(char.mp).padStart(3, ' ')}/{char.maxMp}
                        </Text>
                    </Text>
                );
            })}
        </Box>
    );
}
