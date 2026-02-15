import { useCallback } from 'react';
import {
    type GameState,
    type ShopState,
    type ItemId,
    type StockItem,
    type StackableItem,
    SHOP_COMMANDS,
    TransactionRecord,
} from '../types/index.js';
import { getAllItems, getItem } from '../types/items.js';
import { getPurchaseCostMultiplier } from '../utils/luckUtils.js';

type UseShopStateArgs = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

// ショップで販売するアイテムのリスト（マスタから取得または定義）
// ここでは全アイテムを対象にするか、特定のアイテムだけにするか選べる
// とりあえず全アイテムを表示してみる
const SHOP_ITEMS_LIST = getAllItems().filter(i => i.type !== 'item' && i.type !== 'weapon' && i.type !== 'armor' ? false : true); // 全部

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

    const changeTab = useCallback(
        (tab: 'possessions' | 'stock') => {
            updateShop(() => ({
                sellTab: tab,
                selectedItemIndex: 0,
            }));
        },
        [updateShop],
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
                            ? (prev.selectedItemIndex - 1 + SHOP_ITEMS_LIST.length) %
                            SHOP_ITEMS_LIST.length
                            : (prev.selectedItemIndex + 1) % SHOP_ITEMS_LIST.length;
                    return { selectedItemIndex: next };
                });
            } else if (shop.mode === 'sell') {
                const currentItems = shop.sellTab === 'possessions' ? state.possessions : state.stock;
                updateShop(prev => {
                    const len = Math.max(1, currentItems.length);
                    const next =
                        direction === 'up'
                            ? (prev.selectedItemIndex - 1 + len) % len
                            : (prev.selectedItemIndex + 1) % len;
                    return { selectedItemIndex: next };
                });
            }
        },
        [shop.mode, shop.sellTab, state.possessions.length, state.stock.length, updateShop],
    );

    const enterBuyQuantityMode = useCallback(() => {
        const item = SHOP_ITEMS_LIST[shop.selectedItemIndex];
        if (!item) return;

        updateShop(() => ({
            mode: 'buy_quantity',
            shopMessage: `${item.name} を いくつ かいますか？`,
        }));
    }, [shop.selectedItemIndex, updateShop]);

    const buyItem = useCallback(
        (itemId: ItemId, quantity: number) => {
            const itemData = getItem(itemId);
            const unitPrice = Math.floor(itemData.price * 0.9 * getPurchaseCostMultiplier(state.luck));
            const totalPrice = unitPrice * quantity;

            setState(prev => {
                if (prev.gold < totalPrice) {
                    return {
                        ...prev,
                        shop: {
                            ...prev.shop,
                            shopMessage: 'おかねが たりないようですね…',
                            mode: 'buy', // 戻す
                        },
                    };
                }

                const newStock = [...prev.stock];
                const existingIndex = newStock.findIndex(s => s.itemId === itemId);

                if (existingIndex >= 0) {
                    const existingItem = newStock[existingIndex]!;
                    const currentTotalValue = existingItem.averagePurchasePrice * existingItem.quantity;
                    const newTotalValue = currentTotalValue + totalPrice;
                    const newQuantity = existingItem.quantity + quantity;
                    const newAveragePrice = newTotalValue / newQuantity;

                    newStock[existingIndex] = {
                        ...existingItem,
                        quantity: newQuantity,
                        averagePurchasePrice: newAveragePrice,
                    };
                } else {
                    newStock.push({
                        itemId,
                        quantity,
                        averagePurchasePrice: unitPrice,
                    });
                }

                const transaction: TransactionRecord = {
                    id: crypto.randomUUID(),
                    date: { day: prev.day, hour: prev.hour, minute: prev.minute },
                    type: 'buy',
                    itemId,
                    quantity,
                    price: unitPrice,
                    totalPrice,
                    partner: '卸売業者',
                };

                return {
                    ...prev,
                    gold: prev.gold - totalPrice,
                    stock: newStock,
                    transactions: [...prev.transactions, transaction],
                    shop: {
                        ...prev.shop,
                        mode: 'buy',
                        shopMessage: `${itemData.name} を ${quantity}個 ${totalPrice} G で かいました！`,
                    },
                };
            });
        },
        [setState, state.luck],
    );

    const sellItem = useCallback(
        (index: number) => {
            setState(prev => {
                const isStock = prev.shop.sellTab === 'stock';
                const itemToSell = isStock ? prev.stock[index] : prev.possessions[index];

                if (!itemToSell) {
                    return {
                        ...prev,
                        shop: {
                            ...prev.shop,
                            shopMessage: 'うるものが ありません。',
                        },
                    };
                }

                const itemData = getItem(itemToSell.itemId);
                const sellPrice = Math.floor(itemData.price / 2);

                let nextPossessions = [...prev.possessions];
                let nextStock = [...prev.stock];

                if (isStock) {
                    const stockItem = itemToSell as StockItem;
                    if (stockItem.quantity > 1) {
                        nextStock[index] = { ...stockItem, quantity: stockItem.quantity - 1 };
                    } else {
                        nextStock.splice(index, 1);
                    }
                } else {
                    const possessionItem = itemToSell as StackableItem;
                    if (possessionItem.quantity > 1) {
                        nextPossessions[index] = { ...possessionItem, quantity: possessionItem.quantity - 1 };
                    } else {
                        nextPossessions.splice(index, 1);
                    }
                }

                const transaction: TransactionRecord = {
                    id: crypto.randomUUID(),
                    date: { day: prev.day, hour: prev.hour, minute: prev.minute },
                    type: 'sell',
                    itemId: itemToSell.itemId,
                    quantity: 1,
                    price: sellPrice,
                    totalPrice: sellPrice,
                    partner: '卸売業者',
                };

                const currentListLen = isStock ? nextStock.length : nextPossessions.length;

                return {
                    ...prev,
                    gold: prev.gold + sellPrice,
                    possessions: nextPossessions,
                    stock: nextStock,
                    transactions: [...prev.transactions, transaction],
                    shop: {
                        ...prev.shop,
                        shopMessage: `${itemData.name} を ${sellPrice} G で うりました！`,
                        selectedItemIndex: Math.min(
                            prev.shop.selectedItemIndex,
                            Math.max(0, currentListLen - 1),
                        ),
                    },
                };
            });
        },
        [setState],
    );

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

    const selectMenuItem = useCallback(() => {
        const command = SHOP_COMMANDS[shop.selectedMenuItem];
        switch (command) {
            case '買う':
                updateShop(() => ({
                    mode: 'buy',
                    shopMessage: 'どれを かいますか？',
                }));
                break;
            case '装備':
                updateShop(() => ({
                    shopMessage: 'そのきのうは まだないよ。',
                }));
                break;
            case '戻る':
                exitShop();
                break;
        }
    }, [shop.selectedMenuItem, updateShop, exitShop]);

    const selectItem = useCallback(() => {
        if (shop.mode === 'buy') {
            enterBuyQuantityMode();
        } else if (shop.mode === 'sell') {
            sellItem(shop.selectedItemIndex);
        }
    }, [shop.mode, shop.selectedItemIndex, enterBuyQuantityMode, sellItem]);

    return { moveMenuItem, selectMenuItem, selectItem, goBackToMenu, exitShop, changeTab, buyItem, enterBuyQuantityMode };
}
