import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import { type GameState } from '../types/index.js';
import { useShopSetupState } from '../hooks/useShopSetupState.js';

type Props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
};

export default function ShopSetupScreen({ state, setState, changeScene }: Props) {
    const [selectedInventoryIndex, setSelectedInventoryIndex] = useState(0);
    const [price, setPrice] = useState(100);
    const [mode, setMode] = useState<'select' | 'price'>('select');

    const { addToDisplay, openShop } = useShopSetupState({
        state,
        setState,
        changeScene,
    });

    useInput((_input, key) => {
        if (mode === 'select') {
            if (key.upArrow && state.inventory.length > 0) {
                setSelectedInventoryIndex(prev =>
                    prev > 0 ? prev - 1 : state.inventory.length - 1,
                );
            } else if (key.downArrow && state.inventory.length > 0) {
                setSelectedInventoryIndex(prev =>
                    prev < state.inventory.length - 1 ? prev + 1 : 0,
                );
            } else if (key.return && state.inventory.length > 0) {
                const item = state.inventory[selectedInventoryIndex];
                if (item) {
                    setPrice(Math.floor(item.item.price * 1.5));
                    setMode('price');
                }
            } else if (key.escape) {
                changeScene('menu');
            }
        } else if (mode === 'price') {
            if (key.upArrow) {
                setPrice(prev => prev + 10);
            } else if (key.downArrow) {
                setPrice(prev => Math.max(0, prev - 10));
            } else if (key.return) {
                addToDisplay(selectedInventoryIndex, price);
                setMode('select');
            } else if (key.escape) {
                setMode('select');
            }
        }

        if (_input === 'o' || _input === 'O') {
            if (state.sellShop.displayItems.length > 0) {
                openShop();
            }
        }
    });

    const selectedItem = state.inventory[selectedInventoryIndex];

    return (
        <Box flexDirection="column" width={60}>
            <Box justifyContent="center">
                <Text bold color="cyan">
                    🏪 開店準備 🏪
                </Text>
            </Box>

            <BorderBox>
                <Box flexDirection="column">
                    <Text bold>在庫リスト</Text>
                    <Text> </Text>
                    {state.inventory.length === 0 ? (
                        <Text dimColor>在庫がありません</Text>
                    ) : (
                        state.inventory.slice(0, 5).map((invItem, index) => {
                            const isSelected = mode === 'select' && index === selectedInventoryIndex;
                            return (
                                <Text key={index} color={isSelected ? 'yellow' : undefined}>
                                    {isSelected ? '▶' : ' '} {invItem.item.name} ({invItem.purchasePrice}G)
                                </Text>
                            );
                        })
                    )}
                </Box>
            </BorderBox>

            {mode === 'price' && selectedItem && (
                <BorderBox>
                    <Box flexDirection="column">
                        <Text bold>価格設定</Text>
                        <Text>
                            {selectedItem.item.name}
                        </Text>
                        <Text>
                            値札: <Text color="yellow">{price} G</Text>
                        </Text>
                    </Box>
                </BorderBox>
            )}

            <BorderBox>
                <Box flexDirection="column">
                    <Text bold>陳列中 ({state.sellShop.displayItems.length}個)</Text>
                    <Text> </Text>
                    {state.sellShop.displayItems.length === 0 ? (
                        <Text dimColor>まだ商品がありません</Text>
                    ) : (
                        state.sellShop.displayItems.slice(0, 8).map((item, index) => (
                            <Text key={index}>
                                {item.inventoryItem.item.name} {item.price}G
                            </Text>
                        ))
                    )}
                </Box>
            </BorderBox>

            <BorderBox>
                <Text>{state.sellShop.sellMessage}</Text>
            </BorderBox>

            <Box paddingX={1}>
                {state.sellShop.displayItems.length > 0 && mode === 'select' ? (
                    <Box marginBottom={1}>
                        <Text color="green" bold>
                            準備OK！ [O] キーで みせをひらく
                        </Text>
                    </Box>
                ) : null}
                <Text dimColor>
                    {mode === 'select'
                        ? '↑↓: 選択 Enter: 価格設定 Esc: もどる'
                        : '↑↓: 価格変更(10G) Enter: 陳列 Esc: キャンセル'}
                </Text>
            </Box>
        </Box>
    );
}
