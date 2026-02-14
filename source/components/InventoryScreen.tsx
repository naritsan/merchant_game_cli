import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import ItemList from './ItemList.js';
import { type GameState } from '../types/index.js';

type Props = {
    state: GameState;
    changeScene: (scene: GameState['scene']) => void;
};

export default function InventoryScreen({ state, changeScene }: Props) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { inventory, gold } = state;

    useInput((_input, key) => {
        if (key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setSelectedIndex(prev => Math.min(inventory.length - 1, prev + 1));
        } else if (key.escape || key.return) {
            changeScene('menu');
        }
    });

    const items = inventory.map(inv => inv.item);

    return (
        <Box flexDirection="column" width={60}>
            {/* Title */}
            <Box justifyContent="center">
                <Text bold color="cyan">
                    🎒 もちもの 🎒
                </Text>
            </Box>

            {/* Inventory List */}
            <BorderBox>
                <Box flexDirection="column" minHeight={10}>
                    <ItemList
                        items={items}
                        selectedIndex={selectedIndex}
                        showPrice={true}
                        renderItem={(item) => (
                            <Box flexDirection="row" justifyContent="space-between" width={40}>
                                <Text>{item.name}</Text>
                                <Text>
                                    <Text dimColor>定価 </Text>
                                    {item.price} G
                                </Text>
                            </Box>
                        )}
                    />
                </Box>
            </BorderBox>

            {/* Info Panel */}
            <BorderBox>
                <Box justifyContent="space-between" paddingX={1}>
                    <Text>所持金: <Text color="yellow">{gold} G</Text></Text>
                    <Text>アイテム数: {inventory.length} 個</Text>
                </Box>
            </BorderBox>

            {/* Help */}
            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>↑↓: 選択  Esc/Enter: もどる</Text>
            </Box>
        </Box>
    );
}
