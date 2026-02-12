import { useCallback } from 'react';
import {
    type GameState,
    type Customer,
    type SellShopState,
    CUSTOMERS,
    SHOP_ITEMS,
    SELL_SHOP_COMMANDS,
} from '../types/index.js';

type UseSellShopStateArgs = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
};

function generateCustomer(): Customer {
    const template = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]!;
    const wantItem = SHOP_ITEMS[Math.floor(Math.random() * SHOP_ITEMS.length)]!;
    // 客の予算はアイテム定価の80%〜150%でランダム
    const budgetRate = 0.8 + Math.random() * 0.7;
    const maxBudget = Math.floor(wantItem.price * budgetRate);

    const dialogues = [
        `${wantItem.name} が ほしいのですが…`,
        `${wantItem.name} は ありますか？`,
        `${wantItem.name} を ください！`,
        `${wantItem.name} を さがしています。`,
    ];
    const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)]!;

    return {
        ...template,
        wantItem,
        maxBudget,
        currentNegotiation: 0,
        dialogue,
    };
}

export function useSellShopState({ state, setState, changeScene }: UseSellShopStateArgs) {
    const { sellShop } = state;

    const updateSellShop = useCallback(
        (updater: (prev: SellShopState) => Partial<SellShopState>) => {
            setState(prev => ({
                ...prev,
                sellShop: { ...prev.sellShop, ...updater(prev.sellShop) },
            }));
        },
        [setState],
    );

    // 客を呼ぶ
    const summonCustomer = useCallback(() => {
        const customer = generateCustomer();
        updateSellShop(() => ({
            customer,
            sellMessage: `${customer.name} が やってきた！\n「${customer.dialogue}」`,
            selectedCommand: 0,
            isWaiting: false,
        }));
    }, [updateSellShop]);

    // コマンド移動
    const moveCommand = useCallback(
        (direction: 'up' | 'down') => {
            updateSellShop(prev => {
                const next =
                    direction === 'up'
                        ? (prev.selectedCommand - 1 + SELL_SHOP_COMMANDS.length) %
                        SELL_SHOP_COMMANDS.length
                        : (prev.selectedCommand + 1) % SELL_SHOP_COMMANDS.length;
                return { selectedCommand: next };
            });
        },
        [updateSellShop],
    );

    // 売る
    const sellToCustomer = useCallback(() => {
        setState(prev => {
            const { customer } = prev.sellShop;
            if (!customer) return prev;

            // 在庫チェック
            const itemIndex = prev.inventory.findIndex(
                (invItem) => invItem.item.name === customer.wantItem.name,
            );
            if (itemIndex === -1) {
                return {
                    ...prev,
                    sellShop: {
                        ...prev.sellShop,
                        sellMessage: `${customer.wantItem.name} は ざいこが ありません！`,
                    },
                };
            }

            const sellPrice = customer.wantItem.price;
            const newInventory = [...prev.inventory];
            newInventory.splice(itemIndex, 1);

            return {
                ...prev,
                gold: prev.gold + sellPrice,
                inventory: newInventory,
                sellShop: {
                    ...prev.sellShop,
                    sellMessage: `${customer.wantItem.name} を ${sellPrice} G で うりました！`,
                    salesCount: prev.sellShop.salesCount + 1,
                    customer: null,
                    isWaiting: true,
                },
            };
        });
    }, [setState]);

    // 値引き
    const discount = useCallback(() => {
        setState(prev => {
            const { customer } = prev.sellShop;
            if (!customer) return prev;

            const itemIndex = prev.inventory.findIndex(
                (invItem) => invItem.item.name === customer.wantItem.name,
            );
            if (itemIndex === -1) {
                return {
                    ...prev,
                    sellShop: {
                        ...prev.sellShop,
                        sellMessage: `${customer.wantItem.name} は ざいこが ありません！`,
                    },
                };
            }

            // 値引き: 客の予算で売る
            const sellPrice = customer.maxBudget;
            const newInventory = [...prev.inventory];
            newInventory.splice(itemIndex, 1);

            return {
                ...prev,
                gold: prev.gold + sellPrice,
                inventory: newInventory,
                sellShop: {
                    ...prev.sellShop,
                    sellMessage: `ねびきして ${customer.wantItem.name} を ${sellPrice} G で うりました！`,
                    salesCount: prev.sellShop.salesCount + 1,
                    customer: null,
                    isWaiting: true,
                },
            };
        });
    }, [setState]);

    // 断る
    const refuse = useCallback(() => {
        updateSellShop(prev => {
            const customerName = prev.customer?.name ?? 'きゃく';
            return {
                sellMessage: `${customerName} は ざんねんそうに かえっていった…`,
                customer: null,
                isWaiting: true,
            };
        });
    }, [updateSellShop]);

    // コマンド実行
    const selectCommand = useCallback(() => {
        if (sellShop.isWaiting) {
            // 次の客を呼ぶ
            summonCustomer();
            return;
        }

        const command = SELL_SHOP_COMMANDS[sellShop.selectedCommand]!;
        switch (command) {
            case 'うる': {
                sellToCustomer();
                break;
            }

            case 'カウンター': {
                discount();
                break;
            }

            case 'ことわる': {
                refuse();
                break;
            }

            case 'みせをとじる': {
                updateSellShop(() => ({
                    customer: null,
                    sellMessage: 'みせを ひらいた！',
                    selectedCommand: 0,
                    salesCount: 0,
                    isWaiting: false,
                }));
                changeScene('menu');
                break;
            }

            // No default
        }
    }, [sellShop.selectedCommand, sellShop.isWaiting, sellToCustomer, discount, refuse, summonCustomer, updateSellShop, changeScene]);

    // みせをひらく（最初の客を呼ぶ）
    const openShop = useCallback(() => {
        summonCustomer();
    }, [summonCustomer]);

    return { moveCommand, selectCommand, openShop };
}
