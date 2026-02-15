import { useCallback } from 'react';
import {
    type GameState,
    type Customer,
    type SellShopState,
    type DisplayItem,
    type TransactionRecord,
    CUSTOMERS,
    SELL_SHOP_COMMANDS,
    type Luck,
} from '../types/index.js';
import { getItem } from '../types/items.js';
import { getCustomerBudgetMultiplier } from '../utils/luckUtils.js';

type UseSellShopStateArgs = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

// ヘルパー: DisplayItemからCustomerを生成
function generateCustomer(displayItems: DisplayItem[], luck: Luck): Customer | null {
    if (displayItems.length === 0) return null;

    const template = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]!;
    const targetDisplayItem = displayItems[Math.floor(Math.random() * displayItems.length)]!;
    const wantItemData = getItem(targetDisplayItem.stockItem.itemId);

    // 客の予算はアイテム定価の80%〜110%でランダム
    const budgetRate = 0.8 + Math.random() * 0.3;
    // 運勢補正を適用
    const maxBudget = Math.floor(wantItemData.price * budgetRate * getCustomerBudgetMultiplier(luck));

    const dialogues = [
        `${wantItemData.name} が ほしいのですが…`,
        `${wantItemData.name} は ありますか？`,
        `${wantItemData.name} を ください！`,
        `${wantItemData.name} を さがしています。`,
    ];
    const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)]!;

    return {
        ...template,
        wantItem: wantItemData.id, // IDを使用
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

    // 店を閉じる処理
    const closeShop = useCallback(() => {
        setState(prev => {
            // 売れ残った商品を在庫（Stock）に戻す
            const currentStock = [...prev.stock];

            prev.sellShop.displayItems.forEach(displayItem => {
                const { stockItem } = displayItem;
                const existingIndex = currentStock.findIndex(s => s.itemId === stockItem.itemId);

                if (existingIndex >= 0) {
                    // 既存の在庫とマージ
                    const existing = currentStock[existingIndex]!;
                    // 移動平均の再計算 (既存在庫 * 価格 + 戻り分 * 価格) / 合計個数
                    const totalValue = (existing.averagePurchasePrice * existing.quantity) + (stockItem.averagePurchasePrice * stockItem.quantity);
                    const newQuantity = existing.quantity + stockItem.quantity;

                    currentStock[existingIndex] = {
                        ...existing,
                        quantity: newQuantity,
                        averagePurchasePrice: totalValue / newQuantity
                    };
                } else {
                    // 新規在庫として戻す
                    currentStock.push(stockItem);
                }
            });

            return {
                ...prev,
                stock: currentStock,
                sellShop: {
                    ...prev.sellShop,
                    displayItems: [], // 陳列クリア
                    customer: null,
                    sellMessage: '商品を 陳列して ください',
                    selectedCommand: 0,
                    salesCount: 0,
                    isWaiting: false,
                    currentSales: 0,
                    currentProfit: 0,
                }
            };
        });
        changeScene('menu');
    }, [changeScene, setState]);

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
    }, [state.sellShop.displayItems, state.luck, updateSellShop]);

    // コマンド移動
    const moveCommand = useCallback(
        (direction: 'up' | 'down') => {
            updateSellShop(prev => {
                const { customer } = prev;
                const filteredCommands = SELL_SHOP_COMMANDS.filter(cmd => {
                    if (cmd === 'うる' && customer && customer.targetPrice > customer.maxBudget && customer.currentNegotiation > 0) {
                        return false;
                    }
                    return true;
                });
                const next =
                    direction === 'up'
                        ? (prev.selectedCommand - 1 + filteredCommands.length) %
                        filteredCommands.length
                        : (prev.selectedCommand + 1) % filteredCommands.length;
                return { selectedCommand: next };
            });
        },
        [updateSellShop],
    );

    // 商品売却と陈列の更新
    const executeSale = useCallback((price: number, itemId: string) => {
        setState(prev => {
            const displayIndex = prev.sellShop.displayItems.findIndex(
                d => d.stockItem.itemId === itemId
            );

            if (displayIndex === -1) return prev;

            const targetDisplayItem = prev.sellShop.displayItems[displayIndex]!;
            const itemData = getItem(itemId as any); // Type assertion safely

            // 利益計算
            const profit = price - targetDisplayItem.originalCost;

            // 在庫（陳列）から減らす
            const newDisplayItems = [...prev.sellShop.displayItems];

            // スタック処理：陳列もスタックされている場合、数量を減らす
            // 現状の実装では DisplayItem 内の stockItem.quantity を減らす
            // もし quantity が 1 なら DisplayItem 自体を削除

            const currentQuantity = targetDisplayItem.stockItem.quantity;
            if (currentQuantity > 1) {
                newDisplayItems[displayIndex] = {
                    ...targetDisplayItem,
                    stockItem: {
                        ...targetDisplayItem.stockItem,
                        quantity: currentQuantity - 1
                    }
                };
            } else {
                newDisplayItems.splice(displayIndex, 1);
            }

            // === 取引履歴の記録 ===
            const transaction: TransactionRecord = {
                id: crypto.randomUUID(),
                date: { day: prev.day, hour: prev.hour, minute: prev.minute },
                type: 'sell',
                itemId: itemId as any,
                quantity: 1,
                price: price, // 売値
                totalPrice: price,
                partner: prev.sellShop.customer?.name ?? 'Customer',
            };

            return {
                ...prev,
                gold: prev.gold + price,
                transactions: [...prev.transactions, transaction],
                sellShop: {
                    ...prev.sellShop,
                    displayItems: newDisplayItems,
                    sellMessage: `${itemData.name} を ${price} G で うりました！`,
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
            const nextNegotiation = customer.currentNegotiation + 1;

            if (nextNegotiation < customer.maxNegotiations) {
                updateSellShop(() => ({
                    customer: { ...customer, currentNegotiation: nextNegotiation },
                    sellMessage: `「${customer.targetPrice} G か…\n  もうすこし 安ければ 買えるのだが…」\n（ねびき で 交渉できます）`
                }));
            } else {
                // 交渉終了
                updateSellShop(() => ({
                    customer: null,
                    sellMessage: `「${customer.targetPrice} G か… えんが なかったようだな」\n（客は かえっていった…）`,
                    isWaiting: true
                }));
                advanceTime(30);
            }
            return;
        }

        executeSale(customer.targetPrice, customer.wantItem);
    }, [state.sellShop, updateSellShop, executeSale, advanceTime]);

    // 値引き（カウンター）
    const discount = useCallback((offeredPrice?: number) => {
        const { customer } = state.sellShop;
        if (!customer) return;

        const currentPrice = customer.targetPrice;
        const newPrice = offeredPrice ?? Math.floor(currentPrice * 0.9); // 指定がなければ10%引き
        const nextNegotiation = customer.currentNegotiation + 1;

        // 予算内に入った場合 -> 売れる
        if (newPrice <= customer.maxBudget) {
            executeSale(newPrice, customer.wantItem);
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

        const { customer } = sellShop;
        const filteredCommands = SELL_SHOP_COMMANDS.filter(cmd => {
            if (cmd === 'うる' && customer && customer.targetPrice > customer.maxBudget && customer.currentNegotiation > 0) {
                return false;
            }
            return true;
        });

        const command = filteredCommands[sellShop.selectedCommand]!;
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
        }
    }, [sellShop.selectedCommand, sellShop.isWaiting, sellShop.sellMessage, state.sellShop.displayItems.length, state.hour, sellToCustomer, discount, refuse, summonCustomer, updateSellShop, closeShop]);

    // みせをひらく（最初の客を呼ぶ）
    const openShop = useCallback(() => {
        summonCustomer();
    }, [summonCustomer]);

    return { moveCommand, selectCommand, openShop, sellToCustomer, discount, refuse, closeShop };
}
