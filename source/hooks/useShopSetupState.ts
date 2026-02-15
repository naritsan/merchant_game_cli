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
        (stockIndex: number, price: number) => {
            setState(prev => {
                const currentStock = [...prev.stock];
                const stockItem = currentStock[stockIndex];

                if (!stockItem) return prev;

                // 在庫から1個減らす
                if (stockItem.quantity > 1) {
                    currentStock[stockIndex] = {
                        ...stockItem,
                        quantity: stockItem.quantity - 1,
                    };
                } else {
                    currentStock.splice(stockIndex, 1);
                }

                // 陳列に追加
                // DisplayItem の stockItem は、陳列されているその1個（または複数）を表す
                // 既存の DisplayItem とマージするロジックを入れると親切だが、
                // ShopSetupScreen での選択とインデックス管理が複雑になるため、
                // ここでは単純に新規追加とする（後で売却時に困らないようにする）

                // ただし、ShopSetupScreen側で「同じ商品を複数回選んだ」場合に
                // 別枠で表示されると見栄えが悪いかもしれない。
                // とりあえず単純追加で実装し、表示側でまとめるか、
                // ここでマージするか。
                // DisplayItem { stockItem: { quantity: 1, ... } } として追加する。

                const newItem: DisplayItem = {
                    stockItem: {
                        itemId: stockItem.itemId,
                        quantity: 1,
                        averagePurchasePrice: stockItem.averagePurchasePrice
                    },
                    originalCost: stockItem.averagePurchasePrice,
                    price,
                };

                const itemData = getItem(stockItem.itemId);

                return {
                    ...prev,
                    stock: currentStock,
                    sellShop: {
                        ...prev.sellShop,
                        displayItems: [...prev.sellShop.displayItems, newItem],
                        sellMessage: `${itemData.name} を ${price} G で 陳列しました`,
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
