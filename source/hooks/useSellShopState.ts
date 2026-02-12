import { useCallback } from 'react';
import {
    type GameState,
    type Customer,
    type SellShopState,
    type DisplayItem,
    CUSTOMERS,
    SELL_SHOP_COMMANDS,
} from '../types/index.js';

type UseSellShopStateArgs = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
};

function generateCustomer(displayItems: DisplayItem[]): Customer | null {
    if (displayItems.length === 0) return null;

    const template = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]!;
    const targetDisplayItem = displayItems[Math.floor(Math.random() * displayItems.length)]!;
    const wantItem = targetDisplayItem.inventoryItem.item;

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
        targetStockId: targetDisplayItem.stockId,
        targetPrice: targetDisplayItem.price,
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
        const customer = generateCustomer(state.sellShop.displayItems);

        if (!customer) {
            updateSellShop(() => ({
                customer: null,
                sellMessage: '陳列されている 商品が ありません！\n（「みせをとじる」で 準備してください）',
                selectedCommand: 0,
                isWaiting: true,
            }));
            return;
        }

        updateSellShop(() => ({
            customer,
            sellMessage: `${customer.name} が やってきた！\n「${customer.dialogue}」`,
            selectedCommand: 0,
            isWaiting: false,
        }));
    }, [state.sellShop.displayItems, updateSellShop]);

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

    // 商品売却と在庫・陳列の整合性更新
    const executeSale = useCallback((price: number, targetStockId: number, itemName: string) => {
        setState(prev => {
            // 在庫削除
            const newInventory = [...prev.inventory];
            newInventory.splice(targetStockId, 1);

            // 陳列更新: 売れた商品を削除し、それ以降のstockIdを詰める
            const newDisplayItems = prev.sellShop.displayItems
                .filter(d => d.stockId !== targetStockId) // 売れた商品を削除
                .map(d => ({
                    ...d,
                    stockId: d.stockId > targetStockId ? d.stockId - 1 : d.stockId // インデックスずれ補正
                }));

            return {
                ...prev,
                gold: prev.gold + price,
                inventory: newInventory,
                sellShop: {
                    ...prev.sellShop,
                    displayItems: newDisplayItems,
                    sellMessage: `${itemName} を ${price} G で うりました！`,
                    salesCount: prev.sellShop.salesCount + 1,
                    customer: null,
                    isWaiting: true,
                },
            };
        });
    }, [setState]);

    // 売る
    const sellToCustomer = useCallback(() => {
        const { customer } = state.sellShop;
        if (!customer) return;

        // 値札が高すぎて予算オーバーの場合
        if (customer.targetPrice > customer.maxBudget) {
            updateSellShop(() => ({
                sellMessage: `${customer.name}「${customer.targetPrice}G か…\n  ${customer.maxBudget}G なら 出せるのだが…」\n（カウンターで 値下げできます）`
            }));
            return;
        }

        executeSale(customer.targetPrice, customer.targetStockId, customer.wantItem.name);
    }, [state.sellShop, updateSellShop, executeSale]);

    // 値引き（カウンター）
    const discount = useCallback(() => {
        const { customer } = state.sellShop;
        if (!customer) return;

        const currentPrice = customer.targetPrice;
        const newPrice = Math.floor(currentPrice * 0.9); // 10%引き
        const nextNegotiation = customer.currentNegotiation + 1;

        // 予算内に入った場合 -> 売れる
        if (newPrice <= customer.maxBudget) {
            executeSale(newPrice, customer.targetStockId, customer.wantItem.name);
            updateSellShop(() => ({
                sellMessage: `${customer.name}「ありがとう！ それなら 買います！」\n（${newPrice} G で うれました）`
            }));
            return;
        }

        // まだ高いが、交渉回数が残っている場合
        if (nextNegotiation < customer.maxNegotiations) {
            updateSellShop(_ => {
                const updatedCustomer = {
                    ...customer,
                    targetPrice: newPrice,
                    currentNegotiation: nextNegotiation
                };
                return {
                    customer: updatedCustomer,
                    sellMessage: `${customer.name}「${newPrice} G か… まだ すこし 高いな…」\n（あと {${customer.maxNegotiations - nextNegotiation}} 回 交渉できそうです）`
                };
            });
            return;
        }

        // 交渉決裂
        updateSellShop(() => ({
            customer: null,
            sellMessage: `${customer.name}「${newPrice} G か… えんが なかったようだな」\n（客は かえっていった…）`,
            isWaiting: true
        }));
    }, [state.sellShop, updateSellShop, executeSale]);

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
