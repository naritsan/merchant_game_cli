import React from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import {
    type GameState,
    SELL_SHOP_COMMANDS,
} from '../types/index.js';
import { useSellShopState } from '../hooks/useSellShopState.js';
import { useAcceleratedValue } from '../hooks/useAcceleratedValue.js';
import { getItem } from '../types/items.js';

type Props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

export default function SellShopScreen({ state, setState, changeScene, advanceTime }: Props) {
    const { moveCommand, sellToCustomer, discount, refuse, openShop, selectCommand, closeShop } = useSellShopState({
        state,
        setState,
        changeScene,
        advanceTime,
    });

    const { sellShop } = state;
    const [mode, setMode] = React.useState<'command' | 'discount' | 'confirm_close'>('command');
    const [confirmSelected, setConfirmSelected] = React.useState(0); // 0: はい, 1: いいえ
    const [scrollIndex, setScrollIndex] = React.useState(0);

    // 値引き価格管理（加速ロジック付き）
    const { value: discountPrice, setValue: setDiscountPrice, change: changeDiscountPrice } = useAcceleratedValue(0, 0, 999999);

    // 最初の客を呼ぶ
    React.useEffect(() => {
        if (!sellShop.customer && !sellShop.isWaiting) {
            openShop();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useInput((_input, key) => {
        if (sellShop.isWaiting) {
            if (key.return) {
                // 次の客を呼ぶ（完売時は店を閉じる）
                selectCommand();
            } else if (key.escape) {
                closeShop();
            }
            return;
        }

        if (mode === 'command') {
            if (key.leftArrow) {
                setScrollIndex(prev => Math.max(0, prev - 1));
            } else if (key.rightArrow) {
                const maxScroll = Math.max(0, sellShop.displayItems.length - 6);
                setScrollIndex(prev => Math.min(maxScroll, prev + 1));
            }

            if (key.upArrow) {
                moveCommand('up');
            } else if (key.downArrow) {
                moveCommand('down');
            } else if (key.return) {
                const { customer } = sellShop;
                const filteredCommands = SELL_SHOP_COMMANDS.filter(cmd => {
                    if (customer && customer.targetPrice === 0) {
                        if (cmd === '売る' || cmd === '値引き') return false;
                    }
                    if (cmd === '売る' && customer && customer.targetPrice > customer.maxBudget && customer.currentNegotiation > 0) {
                        return false;
                    }
                    return true;
                });
                const command = filteredCommands[sellShop.selectedCommand];

                if (command === '売る') {
                    sellToCustomer();
                } else if (command === '値引き') {
                    const price = sellShop.customer?.targetPrice ?? 0;
                    setDiscountPrice(Math.floor(price * 0.9)); // 初期値は10%引き
                    setMode('discount');
                } else if (command === '断る') {
                    refuse();
                } else if (command === '店を閉じる') {
                    setConfirmSelected(1); // デフォルトは「いいえ」
                    setMode('confirm_close');
                }
            }
        } else if (mode === 'discount') {
            if (key.upArrow) {
                changeDiscountPrice(1);
            } else if (key.downArrow) {
                changeDiscountPrice(-1);
            } else if (key.leftArrow) {
                changeDiscountPrice(-100);
            } else if (key.rightArrow) {
                changeDiscountPrice(100);
            } else if (key.return) {
                discount(discountPrice);
                setMode('command');
            } else if (key.escape) {
                setMode('command');
            }
        } else if (mode === 'confirm_close') {
            if (key.leftArrow || key.rightArrow || key.upArrow || key.downArrow) {
                setConfirmSelected(prev => 1 - prev);
            } else if (key.escape) {
                setMode('command');
            } else if (key.return) {
                if (confirmSelected === 0) {
                    closeShop();
                } else {
                    setMode('command');
                }
            }
        }
    });

    const { customer } = sellShop;
    const activeItem = customer ? sellShop.displayItems.find(d => d.stockItem.itemId === customer.wantItem) : null;
    const activeItemCost = activeItem && customer ? Math.round(activeItem.originalCost) * customer.wantQuantity : 0;

    const merchant = state.party[0];
    // merchant is possibly undefined if party is empty, though unlikely in this game logic.
    // Adding a fallback to avoid crash if party is somehow empty.
    const merchantName = merchant ? merchant.name : '商人';
    const merchantHp = merchant ? merchant.hp : 0;
    const merchantMaxHp = merchant ? merchant.maxHp : 0;

    // 陳列リストのスクロール表示用
    const VISIBLE_ITEMS = 6;
    const displayItemsSlice = sellShop.displayItems.slice(scrollIndex, scrollIndex + VISIBLE_ITEMS);

    return (
        <Box flexDirection="column" width={60}>
            {/* Title */}
            <Box justifyContent="center">
                <Text bold color="magenta">
                    🏪 {merchantName}のみせ 🏪
                </Text>
            </Box>

            <Box>
                {/* Upper Row: Customer & Display List */}
                <Box flexDirection="column" width={24}>
                    {/* Customer Area */}
                    <BorderBox height={10} flexDirection="column">
                        <Box flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
                            {customer ? (
                                <>
                                    <Text bold>{customer.name}</Text>
                                    <Text> </Text>
                                    <Text>希望: {getItem(customer.wantItem).name.slice(0, 10)} x{customer.wantQuantity}</Text>
                                    {customer.targetPrice === 0 && (
                                        <Text color="red">（陳列なし）</Text>
                                    )}
                                    {state.showCustomerBudget && (
                                        <>
                                            <Text dimColor>定価: {getItem(customer.wantItem).price * customer.wantQuantity}G</Text>
                                            <Text dimColor>(予算: {customer.maxBudget}G)</Text>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Box alignItems="center" justifyContent="center" height={6}>
                                    <Text dimColor>きゃくを まっています…</Text>
                                </Box>
                            )}
                        </Box>
                    </BorderBox>
                </Box>

                <Box flexDirection="column" width={36}>
                    {/* Display List Area */}
                    <BorderBox height={10} flexDirection="column">
                        <Box justifyContent="space-between">
                            <Text bold>陳列リスト</Text>
                            <Text dimColor>{sellShop.displayItems.length}点 {sellShop.displayItems.length > VISIBLE_ITEMS ? `(${scrollIndex + 1}-${Math.min(scrollIndex + VISIBLE_ITEMS, sellShop.displayItems.length)})` : ''}</Text>
                        </Box>
                        {/* Headers */}
                        <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderBottom={true} borderColor="gray" paddingX={0}>
                            <Box width={16}><Text dimColor>品名</Text></Box>
                            <Box width={9} justifyContent="center"><Text dimColor>卸値</Text></Box>
                            <Box width={9} justifyContent="center"><Text dimColor>売値</Text></Box>
                        </Box>

                        {sellShop.displayItems.length === 0 ? (
                            <Box flexGrow={1} alignItems="center" justifyContent="center">
                                <Text dimColor>売切</Text>
                            </Box>
                        ) : (
                            <Box flexDirection="column">
                                {displayItemsSlice.map((item, i) => {
                                    const itemName = getItem(item.stockItem.itemId).name;
                                    const priceStr = `${item.price}G`;
                                    const costStr = `[${Math.round(item.originalCost)}G]`;

                                    // inkのflexboxに任せる。文字列操作でのパディングは完全に廃止し、空白領域が
                                    // 確実に上書きされるようにBoxの背景（widthやflexDrop）を信じる
                                    // ただし wrap="truncate-end" のみ付与して溢れを防止する

                                    return (
                                        <Box key={i}>
                                            <Box width={16}>
                                                <Text wrap="truncate-end">{itemName}</Text>
                                            </Box>
                                            <Box width={9} justifyContent="flex-end">
                                                <Text dimColor>{costStr}</Text>
                                            </Box>
                                            <Box width={9} justifyContent="flex-end">
                                                <Text> {priceStr}</Text>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </BorderBox>
                </Box>
            </Box>

            {/* Message Area (Full Width) */}
            <BorderBox height={6} flexDirection="column" width={60}>
                <Text>{sellShop.sellMessage}</Text>
                {sellShop.isWaiting && (
                    <Text dimColor>{state.hour >= 18 ? '（Enter で みせをとじる）' : '（Enter で つぎのきゃく）'}</Text>
                )}
            </BorderBox>

            {/* Bottom: Commands + Status */}
            <Box>
                <BorderBox width={24}>
                    {sellShop.isWaiting ? (
                        <Box paddingX={1}>
                            <Text dimColor>Enter: つぎへ</Text>
                        </Box>
                    ) : mode === 'discount' ? (
                        <Box flexDirection="column" paddingX={1}>
                            <Text bold>いくらに しますか？</Text>
                            <Box>
                                <Text color="yellow" bold>  {discountPrice} G</Text>
                                <Text dimColor> (仕入: {activeItemCost} G)</Text>
                            </Box>
                            <Text dimColor>↑↓: 増減(長押しで加速)  Enter: 決定</Text>
                        </Box>
                    ) : mode === 'confirm_close' ? (
                        <Box flexDirection="column" paddingX={1}>
                            <Text bold>店を 閉じますか？</Text>
                            <Box flexDirection="row">
                                <Text color={confirmSelected === 0 ? 'yellow' : undefined}>
                                    {confirmSelected === 0 ? '▶ はい' : '  はい'}
                                </Text>
                                <Text>    </Text>
                                <Text color={confirmSelected === 1 ? 'yellow' : undefined}>
                                    {confirmSelected === 1 ? '▶ いいえ' : '  いいえ'}
                                </Text>
                            </Box>
                        </Box>
                    ) : (
                        (() => {
                            const { customer } = sellShop;
                            const filteredCommands = SELL_SHOP_COMMANDS.filter(cmd => {
                                if (customer && customer.targetPrice === 0) {
                                    if (cmd === '売る' || cmd === '値引き') return false;
                                }
                                if (cmd === '売る' && customer && customer.targetPrice > customer.maxBudget && customer.currentNegotiation > 0) {
                                    return false;
                                }
                                return true;
                            });
                            const command = filteredCommands[sellShop.selectedCommand];
                            // 型安全のためのチェック
                            if (!command) return null;

                            const isSelected = (cmd: string) => cmd === command;

                            return (
                                <Box flexDirection="column" marginLeft={2}>
                                    <Text>
                                        {isSelected('売る') ? <Text color="green" bold>▶ 売る</Text> : <Text>  売る</Text>}
                                    </Text>
                                    <Text>
                                        {isSelected('値引き') ? <Text color="green" bold>▶ 値引き</Text> : <Text>  値引き</Text>}
                                    </Text>
                                    <Text>
                                        {isSelected('断る') ? <Text color="green" bold>▶ 断る</Text> : <Text>  断る</Text>}
                                    </Text>
                                    <Text>
                                        {isSelected('店を閉じる') ? <Text color="green" bold>▶ 店を閉じる</Text> : <Text>  店を閉じる</Text>}
                                    </Text>
                                </Box>
                            );
                        })()
                    )}
                </BorderBox>
                <BorderBox width={36}>
                    <Box flexDirection="column" paddingX={1}>
                        <Text>
                            {merchantName} HP {merchantHp}/{merchantMaxHp}
                        </Text>
                        <Text>
                            所持金: <Text color="yellow">{state.gold} G</Text>
                        </Text>
                        <Text>
                            売上: <Text color="green">{sellShop.currentSales ?? 0} G</Text>
                        </Text>
                        <Text>
                            利益: <Text color="green">{sellShop.currentProfit ?? 0} G</Text>
                        </Text>
                        <Text>
                            利益率: <Text color="green">
                                {sellShop.currentSales > 0
                                    ? Math.floor((sellShop.currentProfit / sellShop.currentSales) * 100)
                                    : 0
                                } %
                            </Text>
                        </Text>
                        <Text>
                            販売数: <Text color="green">{sellShop.salesCount}件</Text>
                        </Text>
                    </Box>
                </BorderBox>
            </Box>

            {/* Help */}
            <Box justifyContent="center" marginTop={1}>
                {mode === 'discount'
                    ? <Text dimColor>Esc: キャンセル</Text>
                    : mode === 'confirm_close'
                        ? <Text dimColor>←→: 選択  Enter: 決定  Esc: キャンセル</Text>
                        : <Text dimColor>↑↓: コマンド選択  ←→: リストスクロール  Enter: 決定</Text>
                }
            </Box>
        </Box>
    );
}
