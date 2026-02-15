import { useCallback } from 'react';
import {
    type GameState,
    type Customer,
    type SellShopState,
    type DisplayItem,
    CUSTOMERS,
    SELL_SHOP_COMMANDS,
    type Luck,
} from '../types/index.js';
import { getCustomerBudgetMultiplier } from '../utils/luckUtils.js';

type UseSellShopStateArgs = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

function generateCustomer(displayItems: DisplayItem[], luck: Luck): Customer | null {
    if (displayItems.length === 0) return null;

    const template = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]!;
    const targetDisplayItem = displayItems[Math.floor(Math.random() * displayItems.length)]!;
    const wantItem = targetDisplayItem.inventoryItem.item;

    // 客の予算はアイテム定価の80%〜110%でランダム
    const budgetRate = 0.8 + Math.random() * 0.3;
    // 運勢補正を適用
    const maxBudget = Math.floor(wantItem.price * budgetRate * getCustomerBudgetMultiplier(luck));

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
        targetPrice: targetDisplayItem.price,
        maxBudget,
        currentNegotiation: 0,
        dialogue,
    };
}

export function useSellShopState({ state, setState, changeScene, advanceTime }: UseSellShopStateArgs) {
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

    // 店を閉じる処理の共通化
    const closeShop = useCallback(() => {
        updateSellShop(() => ({
            customer: null,
            sellMessage: '商品を 陳列して ください',
            selectedCommand: 0,
            salesCount: 0,
            isWaiting: false,
            currentSales: 0,
            currentProfit: 0,
        }));
        changeScene('menu');
    }, [updateSellShop, changeScene]);

    // 客を呼ぶ
    const summonCustomer = useCallback(() => {
        const customer = generateCustomer(state.sellShop.displayItems, state.luck);

        if (!customer) {
            updateSellShop(() => ({
                customer: null,
                sellMessage: '陳列されている 商品が ありません！\n（「みせをとじる」で 準備してください）',
                selectedCommand: 0,
                isWaiting: true,
                currentSales: 0,
                currentProfit: 0,
            }));
            return;
        }

        updateSellShop(() => ({
            customer,
            sellMessage: `「${customer.dialogue}」`,
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

    // 商品売却と陳列の更新
    const executeSale = useCallback((price: number, itemName: string) => {
        setState(prev => {
            // 陳列から対象の商品を探して削除
            // 同じ商品が複数ある場合は、最初の1つを売る
            const displayIndex = prev.sellShop.displayItems.findIndex(
                d => d.inventoryItem.item.name === itemName
            );

            if (displayIndex === -1) return prev;

            const newDisplayItems = [...prev.sellShop.displayItems];
            newDisplayItems.splice(displayIndex, 1);

            const profit = price - (prev.sellShop.displayItems[displayIndex]?.inventoryItem.purchasePrice ?? 0);

            return {
                ...prev,
                gold: prev.gold + price,
                // inventoryは陳列時に既に減っているので操作しない
                sellShop: {
                    ...prev.sellShop,
                    displayItems: newDisplayItems,
                    sellMessage: `${itemName} を ${price} G で うりました！`,
                    salesCount: prev.sellShop.salesCount + 1,
                    customer: null,
                    isWaiting: true,
                    currentSales: prev.sellShop.currentSales + price,
                    currentProfit: prev.sellShop.currentProfit + profit,
                },
            };
        });
        advanceTime(30);
    }, [setState, advanceTime]);

    // 売る
    const sellToCustomer = useCallback(() => {
        const { customer } = state.sellShop;
        if (!customer) return;

        // 値札が高すぎて予算オーバーの場合
        if (customer.targetPrice > customer.maxBudget) {
            updateSellShop(() => ({
                sellMessage: `「${customer.targetPrice} G か…\n  もうすこし 安ければ 買えるのだが…」\n（ねびき で 交渉できます）`
            }));
            return;
        }

        executeSale(customer.targetPrice, customer.wantItem.name);
    }, [state.sellShop, updateSellShop, executeSale]);

    // 値引き（カウンター）
    const discount = useCallback((offeredPrice?: number) => {
        const { customer } = state.sellShop;
        if (!customer) return;

        const currentPrice = customer.targetPrice;
        const newPrice = offeredPrice ?? Math.floor(currentPrice * 0.9); // 指定がなければ10%引き
        const nextNegotiation = customer.currentNegotiation + 1;

        // 予算内に入った場合 -> 売れる
        if (newPrice <= customer.maxBudget) {
            executeSale(newPrice, customer.wantItem.name);
            updateSellShop(() => ({
                sellMessage: `「ありがとう！ それなら 買います！」\n（${newPrice} G で うれました）`
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
                    sellMessage: `「${newPrice} G か… まだ すこし 高いな…」`
                };
            });
            return;
        }

        // 交渉決裂
        updateSellShop(() => ({
            customer: null,
            sellMessage: `「${newPrice} G か… えんが なかったようだな」\n（客は かえっていった…）`,
            isWaiting: true
        }));
        advanceTime(30);
    }, [state.sellShop, updateSellShop, executeSale, advanceTime]);

    // 断る
    const refuse = useCallback(() => {
        updateSellShop(_prev => {
            return {
                sellMessage: 'ざんねんそうに かえっていった…',
                customer: null,
                isWaiting: true,
            };
        });
        advanceTime(30);
    }, [updateSellShop, advanceTime]);

    // コマンド実行
    const selectCommand = useCallback(() => {
        // 完売時（待機中で商品がない）の処理
        if (sellShop.isWaiting && state.sellShop.displayItems.length === 0) {
            const soldOutMessage = '完売御礼！\n商品を すべて 売り切りました！';

            // まだ完売メッセージを表示していない場合は表示する
            if (sellShop.sellMessage !== soldOutMessage) {
                updateSellShop(() => ({
                    sellMessage: soldOutMessage,
                }));
                return;
            }

            // 既に完売メッセージを表示済みの場合は店を閉じる
            closeShop();
            return;
        }

        if (sellShop.isWaiting) {
            // 18時以降のチェック（強制閉店）
            if (state.hour >= 18) {
                const closingMessage = 'もう18時です。\n本日の 営業は 終了です。';
                if (sellShop.sellMessage !== closingMessage) {
                    updateSellShop(() => ({
                        sellMessage: closingMessage,
                    }));
                    return;
                }
                closeShop();
                return;
            }

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

            case 'ねびき': {
                discount();
                break;
            }

            case 'ことわる': {
                refuse();
                break;
            }

            case 'みせをとじる': {
                closeShop();
                break;
            }

            // No default
        }
    }, [sellShop.selectedCommand, sellShop.isWaiting, sellToCustomer, discount, refuse, summonCustomer, updateSellShop, changeScene]);

    // みせをひらく（最初の客を呼ぶ）
    const openShop = useCallback(() => {
        summonCustomer();
    }, [summonCustomer]);

    return { moveCommand, selectCommand, openShop, sellToCustomer, discount, refuse, closeShop };
}
