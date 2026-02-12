import { useCallback } from 'react';
import { type GameState, type DisplayItem } from '../types/index.js';

type UseShopSetupStateArgs = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
};

export function useShopSetupState({ setState, changeScene }: UseShopSetupStateArgs) {
    // 商品を陳列に追加
    const addToDisplay = useCallback(
        (inventoryIndex: number, price: number) => {
            setState(prev => {
                const inventoryItem = prev.inventory[inventoryIndex];
                if (!inventoryItem) return prev;

                const displayItem: DisplayItem = {
                    inventoryItem,
                    price,
                    stockId: inventoryIndex,
                };

                return {
                    ...prev,
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
                const removed = newDisplayItems.splice(displayIndex, 1)[0];

                return {
                    ...prev,
                    sellShop: {
                        ...prev.sellShop,
                        displayItems: newDisplayItems,
                        sellMessage: removed
                            ? `${removed.inventoryItem.item.name} を陳列から外しました。`
                            : '',
                    },
                };
            });
        },
        [setState],
    );

    // 開店
    const openShop = useCallback(() => {
        setState(prev => ({
            ...prev,
            sellShop: {
                ...prev.sellShop,
                phase: 'selling',
                sellMessage: 'みせを ひらいた！',
            },
        }));
        changeScene('sell_shop'); // 開店準備完了して販売画面へ
    }, [setState, changeScene]);

    return {
        addToDisplay,
        removeFromDisplay,
        openShop,
    };
}
