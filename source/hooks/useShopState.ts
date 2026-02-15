import { useCallback } from 'react';
import {
    type GameState,
    type ShopState,
    type ItemId,
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
                // 仕入れショップで「売る」は、所持品（Possessions）を売る操作になる想定
                // 実装計画では「仕入れ」「自分の店で売る」が主眼だが、ここでの「売る」は卸売り業者への売却（換金）
                updateShop(prev => {
                    const len = Math.max(1, state.possessions.length);
                    const next =
                        direction === 'up'
                            ? (prev.selectedItemIndex - 1 + len) % len
                            : (prev.selectedItemIndex + 1) % len;
                    return { selectedItemIndex: next };
                });
            }
        },
        [shop.mode, state.possessions.length, updateShop],
    );

    const buyItem = useCallback(
        (itemId: ItemId) => {
            const itemData = getItem(itemId);
            // 卸値は定価の90% * 運勢補正
            const purchasePrice = Math.floor(itemData.price * 0.9 * getPurchaseCostMultiplier(state.luck));

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

                // === 在庫（Stock）への追加ロジック ===
                const newStock = [...prev.stock];
                const existingIndex = newStock.findIndex(s => s.itemId === itemId);

                if (existingIndex >= 0) {
                    // 既存在庫あり：数量追加＆平均取得価格の更新
                    const existingItem = newStock[existingIndex]!;
                    const currentTotalValue = existingItem.averagePurchasePrice * existingItem.quantity;
                    const newTotalValue = currentTotalValue + purchasePrice; // 今回は1個購入
                    const newQuantity = existingItem.quantity + 1;
                    const newAveragePrice = newTotalValue / newQuantity;

                    newStock[existingIndex] = {
                        ...existingItem,
                        quantity: newQuantity,
                        averagePurchasePrice: newAveragePrice,
                    };
                } else {
                    // 新規在庫
                    newStock.push({
                        itemId,
                        quantity: 1,
                        averagePurchasePrice: purchasePrice,
                    });
                }

                // === 取引履歴の記録 ===
                const transaction: TransactionRecord = {
                    id: crypto.randomUUID(),
                    date: { day: prev.day, hour: prev.hour, minute: prev.minute },
                    type: 'buy',
                    itemId,
                    quantity: 1,
                    price: purchasePrice,
                    totalPrice: purchasePrice,
                    partner: '卸売業者',
                };

                return {
                    ...prev,
                    gold: prev.gold - purchasePrice,
                    stock: newStock,
                    transactions: [...prev.transactions, transaction],
                    shop: {
                        ...prev.shop,
                        shopMessage: `${itemData.name} を ${purchasePrice} G で かいました！`,
                    },
                };
            });
        },
        [setState, state.luck],
    );

    const sellItem = useCallback(
        (index: number) => {
            // 卸売業者に「売る」（所持品を処分）する場合
            setState(prev => {
                const possessionItem = prev.possessions[index];
                if (!possessionItem) {
                    return {
                        ...prev,
                        shop: {
                            ...prev.shop,
                            shopMessage: 'うるものが ありません。',
                        },
                    };
                }

                const itemData = getItem(possessionItem.itemId);
                const sellPrice = Math.floor(itemData.price / 2); // 買値の半額（従来のロジック踏襲）

                const newPossessions = [...prev.possessions];
                if (possessionItem.quantity > 1) {
                    newPossessions[index] = { ...possessionItem, quantity: possessionItem.quantity - 1 };
                } else {
                    newPossessions.splice(index, 1);
                }

                // === 取引履歴の記録 ===
                const transaction: TransactionRecord = {
                    id: crypto.randomUUID(),
                    date: { day: prev.day, hour: prev.hour, minute: prev.minute },
                    type: 'sell',
                    itemId: possessionItem.itemId,
                    quantity: 1,
                    price: sellPrice,
                    totalPrice: sellPrice,
                    partner: '卸売業者',
                };

                return {
                    ...prev,
                    gold: prev.gold + sellPrice,
                    possessions: newPossessions,
                    transactions: [...prev.transactions, transaction],
                    shop: {
                        ...prev.shop,
                        shopMessage: `${itemData.name} を ${sellPrice} G で うりました！`,
                        selectedItemIndex: Math.min(
                            prev.shop.selectedItemIndex,
                            Math.max(0, newPossessions.length - 1),
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
            const item = SHOP_ITEMS_LIST[shop.selectedItemIndex];
            if (item) {
                buyItem(item.id);
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
