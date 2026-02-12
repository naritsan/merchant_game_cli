import React from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import CommandMenu from './CommandMenu.js';
import {
    type GameState,
    SELL_SHOP_COMMANDS,
} from '../types/index.js';
import { useSellShopState } from '../hooks/useSellShopState.js';

type Props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
};

export default function SellShopScreen({ state, setState, changeScene }: Props) {
    const { moveCommand, selectCommand, openShop } = useSellShopState({
        state,
        setState,
        changeScene,
    });

    const { sellShop } = state;

    // 最初の客を呼ぶ
    React.useEffect(() => {
        if (!sellShop.customer && !sellShop.isWaiting) {
            openShop();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useInput((_input, key) => {
        if (sellShop.isWaiting) {
            // 待機中は何を押しても次の客
            if (key.return) {
                selectCommand();
            }

            return;
        }

        if (key.upArrow) {
            moveCommand('up');
        } else if (key.downArrow) {
            moveCommand('down');
        } else if (key.return) {
            selectCommand();
        }
    });

    const { customer } = sellShop;
    const merchant = state.party[0]!;

    return (
        <Box flexDirection="column" width={60}>
            {/* Title */}
            <Box justifyContent="center">
                <Text bold color="magenta">
                    🏪 {merchant.name}のみせ 🏪
                </Text>
            </Box>

            {/* Customer Area */}
            <BorderBox>
                {customer ? (
                    <Box flexDirection="column" alignItems="center" paddingY={1}>
                        <Text bold>
                            {customer.name}
                        </Text>
                        <Text> </Text>
                        <Text>「{customer.dialogue}」</Text>
                        <Text> </Text>
                        <Text dimColor>
                            希望: {customer.wantItem.name}　（定価 {customer.wantItem.price} G）
                        </Text>
                    </Box>
                ) : (
                    <Box justifyContent="center" paddingY={1}>
                        <Text dimColor>きゃくを まっています…</Text>
                    </Box>
                )}
            </BorderBox>

            {/* Message */}
            <BorderBox>
                <Text>{sellShop.sellMessage}</Text>
                {sellShop.isWaiting && (
                    <Text dimColor>　（Enter で つぎのきゃく）</Text>
                )}
            </BorderBox>

            {/* Bottom: Commands + Status */}
            <Box>
                <BorderBox flexGrow={1}>
                    {sellShop.isWaiting ? (
                        <Box paddingX={1}>
                            <Text dimColor>Enter: つぎへ</Text>
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
                            在庫: <Text color="cyan">{state.inventory.length}個</Text>
                        </Text>
                        <Text>
                            売上: <Text color="green">{sellShop.salesCount}件</Text>
                        </Text>
                    </Box>
                </BorderBox>
            </Box>

            {/* Help */}
            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>↑↓: 選択  Enter: 決定  Ctrl+C: 終了</Text>
            </Box>
        </Box>
    );
}
