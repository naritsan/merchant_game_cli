import { useCallback } from 'react';
import {
    type GameState,
    type ShopState,
    type Item,
    SHOP_COMMANDS,
    SHOP_ITEMS,
} from '../types/index.js';

type UseShopStateArgs = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

export function useShopState({ state, setState, changeScene, advanceTime }: UseShopStateArgs) {
    const { shop } = state;

    const updateShop = useCallback(
        (updater: (prev: ShopState) => Partial<ShopState>) => {
            setState(prev => ({
                ...prev,
                shop: { ...prev.shop, ...updater(prev.shop) },
            }));
        },
        [setState],
    );

    const moveMenuItem = useCallback(
        (direction: 'up' | 'down') => {
            if (shop.mode === 'menu') {
                updateShop(prev => {
                    const next =
                        direction === 'up'
                            ? (prev.selectedMenuItem - 1 + SHOP_COMMANDS.length) %
                            SHOP_COMMANDS.length
                            : (prev.selectedMenuItem + 1) % SHOP_COMMANDS.length;
                    return { selectedMenuItem: next };
                });
            } else if (shop.mode === 'buy') {
                updateShop(prev => {
                    const next =
                        direction === 'up'
                            ? (prev.selectedItemIndex - 1 + SHOP_ITEMS.length) %
                            SHOP_ITEMS.length
                            : (prev.selectedItemIndex + 1) % SHOP_ITEMS.length;
                    return { selectedItemIndex: next };
                });
            } else if (shop.mode === 'sell') {
                updateShop(prev => {
                    const len = Math.max(1, state.inventory.length);
                    const next =
                        direction === 'up'
                            ? (prev.selectedItemIndex - 1 + len) % len
                            : (prev.selectedItemIndex + 1) % len;
                    return { selectedItemIndex: next };
                });
            }
        },
        [shop.mode, state.inventory.length, updateShop],
    );

    const buyItem = useCallback(
        (item: Item) => {
            const purchasePrice = Math.floor(item.price * 0.6); // 卸値は定価の60%

            setState(prev => {
                if (prev.gold < purchasePrice) {
                    return {
                        ...prev,
                        shop: {
                            ...prev.shop,
                            shopMessage: 'おかねが たりないようですね…',
                        },
                    };
                }

                // InventoryItem作成（仕入れ価格を記録）
                const inventoryItem = {
                    item,
                    purchasePrice,
                };

                return {
                    ...prev,
                    gold: prev.gold - purchasePrice,
                    inventory: [...prev.inventory, inventoryItem],
                    shop: {
                        ...prev.shop,
                        shopMessage: `${item.name} を ${purchasePrice} G で かいました！`,
                    },
                };
            });
            // 購入成功時に以前は時間を進めていましたが、店を出るときに一括で進めるように変更しました。
        },
        [setState, state.gold],
    );

    const sellItem = useCallback(
        (index: number) => {
            setState(prev => {
                const inventoryItem = prev.inventory[index];
                if (!inventoryItem) {
                    return {
                        ...prev,
                        shop: {
                            ...prev.shop,
                            shopMessage: 'うるものが ありません。',
                        },
                    };
                }

                const sellPrice = Math.floor(inventoryItem.item.price / 2);
                const newInventory = [...prev.inventory];
                newInventory.splice(index, 1);

                return {
                    ...prev,
                    gold: prev.gold + sellPrice,
                    inventory: newInventory,
                    shop: {
                        ...prev.shop,
                        shopMessage: `${inventoryItem.item.name} を ${sellPrice} G で うりました！`,
                        selectedItemIndex: Math.min(
                            prev.shop.selectedItemIndex,
                            Math.max(0, newInventory.length - 1),
                        ),
                    },
                };
            });
        },
        [setState],
    );

    const selectMenuItem = useCallback(() => {
        const command = SHOP_COMMANDS[shop.selectedMenuItem]!;
        switch (command) {
            case 'かう': {
                updateShop(() => ({
                    mode: 'buy',
                    selectedItemIndex: 0,
                    shopMessage: 'なにを かいますか？',
                }));
                break;
            }

            case 'うる': {
                updateShop(() => ({
                    mode: 'sell',
                    selectedItemIndex: 0,
                    shopMessage: 'なにを うりますか？',
                }));
                break;
            }

            case 'そうび': {
                updateShop(() => ({
                    shopMessage: 'そうび きのうは まだ できません…',
                }));
                break;
            }

            case 'やめる': {
                updateShop(() => ({
                    shopMessage: 'またのおこしを おまちしています！',
                }));
                exitShop();
                break;
            }

            // No default
        }
    }, [shop.selectedMenuItem, updateShop, changeScene]);

    const selectItem = useCallback(() => {
        if (shop.mode === 'buy') {
            const item = SHOP_ITEMS[shop.selectedItemIndex];
            if (item) {
                buyItem(item);
            }
        } else if (shop.mode === 'sell') {
            sellItem(shop.selectedItemIndex);
        }
    }, [shop.mode, shop.selectedItemIndex, buyItem, sellItem]);

    const goBackToMenu = useCallback(() => {
        updateShop(() => ({
            mode: 'menu',
            shopMessage: 'ほかに なにか ありますか？',
        }));
    }, [updateShop]);

    const exitShop = useCallback(() => {
        advanceTime(60); // 店を出るときに1時間経過
        changeScene('menu');
    }, [advanceTime, changeScene]);

    return { moveMenuItem, selectMenuItem, selectItem, goBackToMenu, exitShop };
}
