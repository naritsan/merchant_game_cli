import { useCallback } from 'react';
import { GameState, DisplayItem } from '../types/index.js';
import { getItem } from '../types/items.js';

type UseShopSetupStateProps = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

export function useShopSetupState({ state: _state, setState, changeScene, advanceTime }: UseShopSetupStateProps) {
    // 商品を陳列に追加
    const addToDisplay = useCallback(
        (stockIndex: number, price: number, quantity: number) => {
            setState(prev => {
                const currentStock = [...prev.stock];
                const stockItem = currentStock[stockIndex];

                if (!stockItem || stockItem.quantity < quantity) return prev;

                // 同一商品の別価格チェック
                const sameItem = prev.sellShop.displayItems.find(d => d.stockItem.itemId === stockItem.itemId);
                if (sameItem && sameItem.price !== price) {
                    return {
                        ...prev,
                        sellShop: {
                            ...prev.sellShop,
                            sellMessage: `エラー: ${getItem(stockItem.itemId).name} は既に ${sameItem.price}G で陳列されています。別の価格では陳列できません。`,
                        },
                    };
                }

                // 在庫から減らす
                if (stockItem.quantity > quantity) {
                    currentStock[stockIndex] = {
                        ...stockItem,
                        quantity: stockItem.quantity - quantity,
                    };
                } else {
                    currentStock.splice(stockIndex, 1);
                }

                // 陳列に追加・更新
                const newDisplayItems = [...prev.sellShop.displayItems];
                const existingIndex = newDisplayItems.findIndex(d => d.stockItem.itemId === stockItem.itemId);

                if (existingIndex >= 0) {
                    const existing = newDisplayItems[existingIndex]!;
                    newDisplayItems[existingIndex] = {
                        ...existing,
                        stockItem: {
                            ...existing.stockItem,
                            quantity: existing.stockItem.quantity + quantity
                        }
                    };
                } else {
                    const newItem: DisplayItem = {
                        stockItem: {
                            itemId: stockItem.itemId,
                            quantity: quantity,
                            averagePurchasePrice: stockItem.averagePurchasePrice
                        },
                        originalCost: stockItem.averagePurchasePrice,
                        price,
                    };
                    newDisplayItems.push(newItem);
                }

                const itemData = getItem(stockItem.itemId);

                return {
                    ...prev,
                    stock: currentStock,
                    sellShop: {
                        ...prev.sellShop,
                        displayItems: newDisplayItems,
                        sellMessage: `${itemData.name} を ${quantity}個 ${price}G で陳列しました`,
                    },
                };
            });
        },
        [setState],
    );

    const openShop = useCallback(() => {
        // まず準備時間として1時間経過させる
        advanceTime(60);

        setState(prev => {
            if (prev.hour >= 18) {
                changeScene('menu');
                return {
                    ...prev,
                    sellShop: {
                        ...prev.sellShop,
                        sellMessage: 'もう18時です。営業を終了します。',
                    }
                };
            }

            changeScene('sell_shop');
            return {
                ...prev,
                sellShop: {
                    ...prev.sellShop,
                    phase: 'selling',
                    sellMessage: 'いらっしゃいませ！\n（お客さんが 来るのを 待っています…）',
                    isWaiting: true,
                    salesCount: 0,
                    currentSales: 0,
                    currentProfit: 0,
                },
            };
        });
    }, [setState, advanceTime, changeScene]);

    return {
        addToDisplay,
        openShop,
    };
}
