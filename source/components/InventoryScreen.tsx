import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import { GameState } from '../types/index.js';
import { getItem } from '../types/items.js';

type Props = {
    state: GameState;
    changeScene: (scene: GameState['scene']) => void;
};

export default function InventoryScreen({ state, changeScene }: Props) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { possessions } = state;

    useInput((_input, key) => {
        if (key.upArrow && possessions.length > 0) {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : possessions.length - 1));
        }
        if (key.downArrow && possessions.length > 0) {
            setSelectedIndex(prev => (prev < possessions.length - 1 ? prev + 1 : 0));
        }
        if (key.escape) {
            changeScene('menu');
        }
    });

    const selectedItem = possessions[selectedIndex];
    const itemData = selectedItem ? getItem(selectedItem.itemId) : null;

    // スクロール表示用
    const MAX_VISIBLE_ITEMS = 8;
    let start = 0;
    let end = possessions.length;

    if (possessions.length > MAX_VISIBLE_ITEMS) {
        const half = Math.floor(MAX_VISIBLE_ITEMS / 2);
        start = Math.max(0, selectedIndex - half);
        end = start + MAX_VISIBLE_ITEMS;
        if (end > possessions.length) {
            end = possessions.length;
            start = Math.max(0, end - MAX_VISIBLE_ITEMS);
        }
    }
    const visibleItems = possessions.slice(start, end);

    return (
        <Box flexDirection="column" width={60}>
            <Box justifyContent="center">
                <Text bold color="cyan">
                    🎒 もちもの 🎒
                </Text>
            </Box>

            <Box flexDirection="row" justifyContent="space-between" marginY={1}>
                {/* Item List */}
                <BorderBox width={35}>
                    <Box flexDirection="column">
                        <Text bold>アイテムリスト</Text>
                        <Text> </Text>
                        {possessions.length === 0 ? (
                            <Text dimColor>なにも もっていません</Text>
                        ) : (
                            <Box flexDirection="column">
                                {start > 0 && <Text dimColor>  ...</Text>}
                                {visibleItems.map((item, i) => {
                                    const index = start + i;
                                    const isSelected = index === selectedIndex;
                                    const iData = getItem(item.itemId);
                                    return (
                                        <Text key={index} color={isSelected ? 'yellow' : undefined}>
                                            {isSelected ? '▶' : ' '} {iData.name} x{item.quantity}
                                        </Text>
                                    );
                                })}
                                {end < possessions.length && <Text dimColor>  ...</Text>}
                            </Box>
                        )}
                    </Box>
                </BorderBox>

                {/* Details */}
                <BorderBox width={23}>
                    <Box flexDirection="column">
                        <Text bold>詳細</Text>
                        <Text> </Text>
                        {itemData ? (
                            <Box flexDirection="column">
                                <Text color="green">{itemData.name}</Text>
                                <Text>タイプ: {itemData.type}</Text>
                                <Text>価値: {itemData.price} G</Text>
                                {itemData.attack !== undefined && (
                                    <Text>攻撃力: {itemData.attack}</Text>
                                )}
                                {itemData.defense !== undefined && (
                                    <Text>防御力: {itemData.defense}</Text>
                                )}
                                <Text> </Text>
                                <Text dimColor>{itemData.description}</Text>
                            </Box>
                        ) : (
                            <Text dimColor>選択してください</Text>
                        )}
                    </Box>
                </BorderBox>
            </Box>

            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>Esc: もどる</Text>
            </Box>
        </Box>
    );
}
