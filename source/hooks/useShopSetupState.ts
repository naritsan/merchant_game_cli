import { useCallback } from 'react';
import { type GameState, type DisplayItem } from '../types/index.js';

type UseShopSetupStateArgs = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

export function useShopSetupState({ setState, changeScene, advanceTime }: UseShopSetupStateArgs) {
    // 商品を陳列に追加
    const addToDisplay = useCallback(
        (inventoryIndex: number, price: number) => {
            setState(prev => {
                const newInventory = [...prev.inventory];
                const [inventoryItem] = newInventory.splice(inventoryIndex, 1);

                if (!inventoryItem) return prev;

                const displayItem: DisplayItem = {
                    inventoryItem,
                    price,
                };

                return {
                    ...prev,
                    inventory: newInventory,
                    sellShop: {
                        ...prev.sellShop,
                        displayItems: [...prev.sellShop.displayItems, displayItem],
                        sellMessage: `${inventoryItem.item.name} を ${price}G で陳列しました！`,
                    },
                };
            });
            advanceTime(30);
        },
        [setState, advanceTime],
    );

    // 陳列から削除
    const removeFromDisplay = useCallback(
        (displayIndex: number) => {
            setState(prev => {
                const newDisplayItems = [...prev.sellShop.displayItems];
                const [removed] = newDisplayItems.splice(displayIndex, 1);

                if (!removed) return prev;

                const newInventory = [...prev.inventory, removed.inventoryItem];

                return {
                    ...prev,
                    inventory: newInventory,
                    sellShop: {
                        ...prev.sellShop,
                        displayItems: newDisplayItems,
                        sellMessage: `${removed.inventoryItem.item.name} を陳列から外しました。`,
                    },
                };
            });
        },
        [setState],
    );

    // 開店
    const openShop = useCallback(() => {
        // 時間チェック
        setState(prev => {
            if (prev.hour >= 18) {
                return {
                    ...prev,
                    sellShop: {
                        ...prev.sellShop,
                        sellMessage: 'もう18時です。営業を終了します。',
                    }
                };
            }
            return {
                ...prev,
                sellShop: {
                    ...prev.sellShop,
                    phase: 'selling',
                    sellMessage: 'みせを ひらいた！',
                },
            };
        });

        // 状態を反映した後に遷移するかどうかを判断するため、本来はここでstateを見る必要がある
        // シンプルに、hour >= 18だったらメニューに戻るようにする
        setState(prev => {
            if (prev.hour >= 18) {
                changeScene('menu');
            } else {
                changeScene('sell_shop');
            }
            return prev;
        });
    }, [setState, changeScene]);

    return {
        addToDisplay,
        removeFromDisplay,
        openShop,
    };
}
