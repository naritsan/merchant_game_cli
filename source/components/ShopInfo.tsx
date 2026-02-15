import React from 'react';
import { Box, Text } from 'ink';
import { type Character, type StackableItem } from '../types/index.js';
import { getItem } from '../types/items.js';

type Props = {
    gold: number;
    possessions: StackableItem[];
    party: Character[];
};

export default function ShopInfo({ gold, possessions, party }: Props) {
    return (
        <Box flexDirection="column" paddingX={1}>
            <Text bold>
                所持金: <Text color="yellow">{gold} G</Text>
            </Text>
            <Text>アイテム数: {possessions.length} 個</Text>
            <Text> </Text>
            {party.map(char => (
                <Text key={char.name}>
                    {char.name}: {char.weapon ? getItem(char.weapon).name : 'なし'} / {char.armor ? getItem(char.armor).name : 'なし'}
                </Text>
            ))}
        </Box>
    );
}
