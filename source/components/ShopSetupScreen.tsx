import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import { type GameState } from '../types/index.js';
import { useShopSetupState } from '../hooks/useShopSetupState.js';
import { useAcceleratedValue } from '../hooks/useAcceleratedValue.js';
import { getItem } from '../types/items.js';

type Props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

export default function ShopSetupScreen({ state, setState, changeScene, advanceTime }: Props) {
    const [selectedStockIndex, setSelectedStockIndex] = useState(0);
    // 価格設定（加速ロジック付き）
    const { value: price, setValue: setPrice, change: changePrice } = useAcceleratedValue(100, 0, 999999);
    const [mode, setMode] = useState<'select' | 'price'>('select');

    const { addToDisplay, openShop } = useShopSetupState({
        state,
        setState,
        changeScene,
        advanceTime,
    });

    const stockList = state.stock;

    useInput((_input, key) => {
        if (mode === 'select') {
            if (key.upArrow && stockList.length > 0) {
                setSelectedStockIndex(prev =>
                    prev > 0 ? prev - 1 : stockList.length - 1,
                );
            } else if (key.downArrow && stockList.length > 0) {
                setSelectedStockIndex(prev =>
                    prev < stockList.length - 1 ? prev + 1 : 0,
                );
            } else if (key.return && stockList.length > 0) {
                const item = stockList[selectedStockIndex];
                if (item) {
                    const itemData = getItem(item.itemId);
                    setPrice(itemData.price);
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
                addToDisplay(selectedStockIndex, price);
                setMode('select');
                // リストが減るのでインデックスを調整
                setSelectedStockIndex(prev => Math.max(0, prev - 1));
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

    const selectedItem = stockList[selectedStockIndex];

    // 在庫リストのスクロール計算
    const MAX_VISIBLE_INVENTORY = 5;
    let invStart = 0;
    let invEnd = stockList.length;

    if (stockList.length > MAX_VISIBLE_INVENTORY) {
        const half = Math.floor(MAX_VISIBLE_INVENTORY / 2);
        invStart = Math.max(0, selectedStockIndex - half);
        invEnd = invStart + MAX_VISIBLE_INVENTORY;
        if (invEnd > stockList.length) {
            invEnd = stockList.length;
            invStart = Math.max(0, invEnd - MAX_VISIBLE_INVENTORY);
        }
    }
    const visibleStock = stockList.slice(invStart, invEnd);

    return (
        <Box flexDirection="column" width={60}>
            <Box justifyContent="center">
                <Text bold color="cyan">
                    🏪 開店準備 🏪
                </Text>
            </Box>

            <BorderBox>
                <Box flexDirection="column">
                    <Text bold>在庫リスト (Stock)</Text>
                    <Text> </Text>
                    {stockList.length === 0 ? (
                        <Text dimColor>在庫がありません</Text>
                    ) : (
                        <Box flexDirection="column">
                            {invStart > 0 && <Text dimColor>  ...</Text>}
                            {visibleStock.map((stockItem, i) => {
                                const index = invStart + i;
                                const isSelected = mode === 'select' && index === selectedStockIndex;
                                const itemData = getItem(stockItem.itemId);
                                return (
                                    <Text key={index} color={isSelected ? 'yellow' : undefined}>
                                        {isSelected ? '▶' : ' '} {itemData.name} x{stockItem.quantity} (Avg: {Math.round(stockItem.averagePurchasePrice)}G)
                                    </Text>
                                );
                            })}
                            {invEnd < stockList.length && <Text dimColor>  ...</Text>}
                        </Box>
                    )}
                </Box>
            </BorderBox>

            {mode === 'price' && selectedItem && (
                <BorderBox>
                    <Box flexDirection="column">
                        <Text bold>価格設定</Text>
                        <Text>
                            {getItem(selectedItem.itemId).name}
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
                        state.sellShop.displayItems.slice(-8).map((displayItem, index) => {
                            const itemData = getItem(displayItem.stockItem.itemId);
                            return (
                                <Text key={index}>
                                    {itemData.name} {displayItem.price}G
                                </Text>
                            );
                        })
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
