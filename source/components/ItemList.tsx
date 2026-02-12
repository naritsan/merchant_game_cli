import React from 'react';
import { Box, Text } from 'ink';
import { type Item } from '../types/index.js';

type Props = {
    items: Item[];
    selectedIndex: number;
    showPrice?: boolean;
};

export default function ItemList({ items, selectedIndex, showPrice = true }: Props) {
    if (items.length === 0) {
        return (
            <Box paddingX={1}>
                <Text dimColor>アイテムが ありません</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" paddingX={1}>
            {items.map((item, i) => {
                const isSelected = i === selectedIndex;
                const priceText = showPrice
                    ? `${String(item.price).padStart(5, ' ')} G`
                    : '';
                return (
                    <Text key={`${item.name}-${i}`}>
                        {isSelected ? (
                            <Text color="yellow" bold>
                                ▶ {item.name}
                                {priceText ? `  ${priceText}` : ''}
                            </Text>
                        ) : (
                            <Text>
                                {'  '}
                                {item.name}
                                {priceText ? `  ${priceText}` : ''}
                            </Text>
                        )}
                    </Text>
                );
            })}
        </Box>
    );
}
