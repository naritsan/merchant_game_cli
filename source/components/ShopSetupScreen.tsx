import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import { type GameState } from '../types/index.js';
import { useShopSetupState } from '../hooks/useShopSetupState.js';
import { useAcceleratedValue } from '../hooks/useAcceleratedValue.js';

type Props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

export default function ShopSetupScreen({ state, setState, changeScene, advanceTime }: Props) {
    const [selectedInventoryIndex, setSelectedInventoryIndex] = useState(0);
    // 価格設定（加速ロジック付き）
    const { value: price, setValue: setPrice, change: changePrice } = useAcceleratedValue(100, 0, 999999);
    const [mode, setMode] = useState<'select' | 'price'>('select');

    const { addToDisplay, openShop } = useShopSetupState({
        state,
        setState,
        changeScene,
        advanceTime,
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
                changePrice(1);
            } else if (key.downArrow) {
                changePrice(-1);
            } else if (key.leftArrow) {
                changePrice(-100);
            } else if (key.rightArrow) {
                changePrice(100);
            } else if (key.return) {
                addToDisplay(selectedInventoryIndex, price);
                setMode('select');
            } else if (key.escape) {
                setMode('select');
            }
        }

        if (_input === 'p' || _input === 'P') {
            if (state.sellShop.displayItems.length > 0) {
                openShop();
            }
        }
    });

    const selectedItem = state.inventory[selectedInventoryIndex];

    // 在庫リストのスクロール計算
    const MAX_VISIBLE_INVENTORY = 5;
    let invStart = 0;
    let invEnd = state.inventory.length;

    if (state.inventory.length > MAX_VISIBLE_INVENTORY) {
        const half = Math.floor(MAX_VISIBLE_INVENTORY / 2);
        invStart = Math.max(0, selectedInventoryIndex - half);
        invEnd = invStart + MAX_VISIBLE_INVENTORY;
        if (invEnd > state.inventory.length) {
            invEnd = state.inventory.length;
            invStart = Math.max(0, invEnd - MAX_VISIBLE_INVENTORY);
        }
    }
    const visibleInventory = state.inventory.slice(invStart, invEnd);

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
                        <Box flexDirection="column">
                            {invStart > 0 && <Text dimColor>  ...</Text>}
                            {visibleInventory.map((invItem, i) => {
                                const index = invStart + i;
                                const isSelected = mode === 'select' && index === selectedInventoryIndex;
                                return (
                                    <Text key={index} color={isSelected ? 'yellow' : undefined}>
                                        {isSelected ? '▶' : ' '} {invItem.item.name} ({invItem.purchasePrice}G)
                                    </Text>
                                );
                            })}
                            {invEnd < state.inventory.length && <Text dimColor>  ...</Text>}
                        </Box>
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
                        // 最新の追加が見えるように末尾を表示
                        state.sellShop.displayItems.slice(-8).map((item, index) => (
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
                            準備OK！ [P] キーで みせをひらく
                        </Text>
                    </Box>
                ) : null}
                <Text dimColor>
                    {mode === 'select'
                        ? '↑↓: 選択 Enter: 価格設定 Esc: もどる'
                        : '↑↓: 増減(長押し加速) ←→: ±100 Enter: 陳列 Esc: キャンセル'}
                </Text>
            </Box>
        </Box>
    );
}
