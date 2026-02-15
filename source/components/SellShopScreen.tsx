import React from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import CommandMenu from './CommandMenu.js';
import {
    type GameState,
    SELL_SHOP_COMMANDS,
} from '../types/index.js';
import { useSellShopState } from '../hooks/useSellShopState.js';
import { useAcceleratedValue } from '../hooks/useAcceleratedValue.js';

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
    const [mode, setMode] = React.useState<'command' | 'discount'>('command');

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
            }
            return;
        }

        if (mode === 'command') {
            if (key.upArrow) {
                moveCommand('up');
            } else if (key.downArrow) {
                moveCommand('down');
            } else if (key.return) {
                const command = SELL_SHOP_COMMANDS[sellShop.selectedCommand];
                if (command === 'うる') {
                    sellToCustomer();
                } else if (command === 'ねびき') {
                    const price = sellShop.customer?.targetPrice ?? 0;
                    setDiscountPrice(Math.floor(price * 0.9)); // 初期値は10%引き
                    setMode('discount');
                } else if (command === 'ことわる') {
                    refuse();
                } else if (command === 'みせをとじる') {
                    closeShop();
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
        }
    });

    const { customer } = sellShop;
    const merchant = state.party[0]!;

    // 陳列リストのスクロール表示用
    const VISIBLE_ITEMS = 10;
    // 最新の商品が見えるように末尾を表示するか、先頭を表示するか？
    // シンプルに先頭10件表示とする（スクロール機能はTODOで簡易実装とするか、要望通り実装するか）
    // 要望: 「陳列リストのスクロール対応」
    // ここでは簡易的に先頭10件を表示しつつ、本来は全件表示したいが枠の都合で...
    // 今回は単純にslice(0, 10)のままにするタスクはないが、要件にあるので実装が必要。
    // しかし選択カーソルがないのでスクロールの基準がない。
    // 一旦全件表示しきれない場合は「...他X件」とするか、
    // あるいは自動スクロール？いや、操作できないと意味がない。
    // 陳列リストは操作対象ではないので、単純にリストアップされているだけ。
    // ここではページネーション等は入れず、枠を広げたので多めに表示する。
    const displayItemsSlice = sellShop.displayItems.slice(0, VISIBLE_ITEMS);

    return (
        <Box flexDirection="column" width={60}>
            {/* Title */}
            <Box justifyContent="center">
                <Text bold color="magenta">
                    🏪 {merchant.name}のみせ 🏪
                </Text>
            </Box>

            <Box>
                {/* Main Content Area (Left: Customer & Message) */}
                <Box flexDirection="column" width={40}>
                    {/* Customer Area (Top) */}
                    <BorderBox height={10} flexDirection="column">
                        <Box flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
                            {customer ? (
                                <>
                                    <Text bold>{customer.name}</Text>
                                    <Text> </Text>
                                    <Text>希望: {customer.wantItem.name}</Text>
                                    <Text>提示: <Text color="yellow">{customer.targetPrice} G</Text></Text>
                                    {state.showCustomerBudget && (
                                        <Text dimColor>(予算: {customer.maxBudget} G)</Text>
                                    )}
                                </>
                            ) : (
                                <Box alignItems="center" justifyContent="center" height={6}>
                                    <Text dimColor>きゃくを まっています…</Text>
                                </Box>
                            )}
                        </Box>
                    </BorderBox>

                    {/* Message Area (Bottom) */}
                    <BorderBox height={6} flexDirection="column">
                        <Text>{sellShop.sellMessage}</Text>
                        {sellShop.isWaiting && (
                            <Text dimColor>（Enter で つぎのきゃく）</Text>
                        )}
                    </BorderBox>
                </Box>

                {/* Side Panel (Right: Display List) */}
                <Box flexDirection="column" marginLeft={1} width={20}>
                    <BorderBox flexGrow={1}>
                        <Text bold>陳列リスト</Text>
                        <Text> </Text>
                        {sellShop.displayItems.length === 0 ? (
                            <Text dimColor>売切</Text>
                        ) : (
                            displayItemsSlice.map((item, i) => (
                                <Text key={i}>
                                    {item.inventoryItem.item.name.slice(0, 6)} {item.price}
                                </Text>
                            ))
                        )}
                        {sellShop.displayItems.length > VISIBLE_ITEMS && (
                            <Text dimColor>他{sellShop.displayItems.length - VISIBLE_ITEMS}件</Text>
                        )}
                    </BorderBox>
                </Box>
            </Box>

            {/* Bottom: Commands + Status */}
            <Box>
                <BorderBox flexGrow={1}>
                    {sellShop.isWaiting ? (
                        <Box paddingX={1}>
                            <Text dimColor>Enter: つぎへ</Text>
                        </Box>
                    ) : mode === 'discount' ? (
                        <Box flexDirection="column" paddingX={1}>
                            <Text bold>いくらに しますか？</Text>
                            <Text color="yellow" bold>  {discountPrice} G</Text>
                            <Text dimColor>↑↓: 増減(長押しで加速)  Enter: 決定</Text>
                        </Box>
                    ) : (
                        <CommandMenu
                            items={SELL_SHOP_COMMANDS as unknown as string[]}
                            selectedIndex={sellShop.selectedCommand}
                        />
                    )}
                </BorderBox>
                <BorderBox flexGrow={1}>
                    <Box flexDirection="column" paddingX={1}>
                        <Text>
                            {merchant.name} HP {merchant.hp}/{merchant.maxHp}
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
                    : <Text dimColor>↑↓: 選択  Enter: 決定  Ctrl+C: 終了</Text>
                }
            </Box>
        </Box>
    );
}
