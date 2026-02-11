import React from 'react';
import { Box, Text } from 'ink';
import { type Character } from '../types/index.js';

type Props = {
    gold: number;
    party: Character[];
};

export default function ShopInfo({ gold, party }: Props) {
    return (
        <Box flexDirection="column" paddingX={1}>
            <Text bold>
                所持金: <Text color="yellow">{gold} G</Text>
            </Text>
            <Text> </Text>
            {party.map(char => (
                <Text key={char.name}>
                    {char.name}: {char.weapon ? char.weapon.name : 'なし'} / {char.armor ? char.armor.name : 'なし'}
                </Text>
            ))}
        </Box>
    );
}
