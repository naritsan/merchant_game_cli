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
    const [activeTab, setActiveTab] = useState<'possessions' | 'stock'>('possessions');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { possessions, stock } = state;

    const currentItems = activeTab === 'possessions' ? possessions : stock;

    useInput((_input, key) => {
        if (key.upArrow && currentItems.length > 0) {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : currentItems.length - 1));
        }
        if (key.downArrow && currentItems.length > 0) {
            setSelectedIndex(prev => (prev < currentItems.length - 1 ? prev + 1 : 0));
        }
        if (key.leftArrow || key.rightArrow) {
            setActiveTab(prev => {
                const next = prev === 'possessions' ? 'stock' : 'possessions';
                setSelectedIndex(0); // タブ切り替え時にインデックスをリセット
                return next;
            });
        }
        if (key.escape) {
            changeScene('menu');
        }
    });

    const selectedItem = currentItems[selectedIndex];
    const itemData = selectedItem ? getItem(selectedItem.itemId) : null;

    // スクロール表示用
    const MAX_VISIBLE_ITEMS = 10;
    let start = 0;
    let end = currentItems.length;

    if (currentItems.length > MAX_VISIBLE_ITEMS) {
        const half = Math.floor(MAX_VISIBLE_ITEMS / 2);
        start = Math.max(0, selectedIndex - half);
        end = start + MAX_VISIBLE_ITEMS;
        if (end > currentItems.length) {
            end = currentItems.length;
            start = Math.max(0, end - MAX_VISIBLE_ITEMS);
        }
    }
    const visibleItems = currentItems.slice(start, end);

    return (
        <Box flexDirection="column" width={60}>
            <Box justifyContent="center">
                <Text bold color="cyan">
                    🎒 もちもの状況 🎒
                </Text>
            </Box>

            {/* Tab Header */}
            <Box flexDirection="row" justifyContent="center" marginTop={1}>
                <Box borderStyle="single" borderColor={activeTab === 'possessions' ? 'cyan' : 'gray'} paddingX={1}>
                    <Text color={activeTab === 'possessions' ? 'cyan' : undefined} bold={activeTab === 'possessions'}>
                        {activeTab === 'possessions' ? '● ' : '  '}手持ち (Possessions)
                    </Text>
                </Box>
                <Box borderStyle="single" borderColor={activeTab === 'stock' ? 'yellow' : 'gray'} paddingX={1} marginLeft={1}>
                    <Text color={activeTab === 'stock' ? 'yellow' : undefined} bold={activeTab === 'stock'}>
                        {activeTab === 'stock' ? '● ' : '  '}在庫 (Stock)
                    </Text>
                </Box>
            </Box>

            <Box flexDirection="row" justifyContent="space-between" marginY={1}>
                {/* Item List */}
                <BorderBox width={35}>
                    <Box flexDirection="column">
                        <Text bold>{activeTab === 'possessions' ? '手持ちリスト' : '在庫リスト'}</Text>
                        <Text> </Text>
                        {currentItems.length === 0 ? (
                            <Text dimColor>なにも もっていません</Text>
                        ) : (
                            <Box flexDirection="column">
                                {start > 0 && <Text dimColor>  ...</Text>}
                                {visibleItems.map((item, i) => {
                                    const index = start + i;
                                    const isSelected = index === selectedIndex;
                                    const iData = getItem(item.itemId);

                                    return (
                                        <Box key={index}>
                                            <Text color={isSelected ? 'white' : undefined} backgroundColor={isSelected ? 'blue' : undefined}>
                                                {isSelected ? '▶' : ' '} {iData.name.padEnd(12)}
                                                <Text dimColor> x{item.quantity.toString().padStart(2)} </Text>
                                            </Text>
                                        </Box>
                                    );
                                })}
                                {end < currentItems.length && <Text dimColor>  ...</Text>}
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
                                <Text color="green" bold>{itemData.name}</Text>
                                <Text>タイプ: {itemData.type}</Text>
                                <Text>価値: {itemData.price} G</Text>
                                {itemData.attack !== undefined && (
                                    <Text>攻撃力: {itemData.attack}</Text>
                                )}
                                {itemData.defense !== undefined && (
                                    <Text>防御力: {itemData.defense}</Text>
                                )}
                                <Text> </Text>
                                <Text dimColor italic>{itemData.description}</Text>
                                {activeTab === 'stock' && (
                                    <Box marginTop={1}>
                                        <Text color="gray">平均仕入: {(selectedItem as any).averagePurchasePrice}G</Text>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Text dimColor>選択してください</Text>
                        )}
                    </Box>
                </BorderBox>
            </Box>

            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>←→: タブ切替  ↑↓: 選択  Esc: もどる</Text>
            </Box>
        </Box>
    );
}
