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
        },
        [setState],
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
        // まず準備時間として1時間経過させる
        advanceTime(60);

        // 時間経過後の状態に基づいて、開店可能か判断する
        // setStateは関数型更新なので、直前のadvanceTime（の中のsetState）の結果を引き継ぐ
        setState(prev => {
            if (prev.hour >= 18) {
                // 18時を過ぎてしまった場合は強制的にメニューへ
                changeScene('menu');
                return {
                    ...prev,
                    sellShop: {
                        ...prev.sellShop,
                        sellMessage: 'もう18時です。営業を終了します。',
                    }
                };
            }

            // 開店成功
            changeScene('sell_shop');
            return {
                ...prev,
                sellShop: {
                    ...prev.sellShop,
                    phase: 'selling',
                    sellMessage: 'みせを ひらいた！',
                },
            };
        });
    }, [setState, advanceTime, changeScene]);

    return {
        addToDisplay,
        removeFromDisplay,
        openShop,
    };
}
