import React from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import CommandMenu from './CommandMenu.js';
import ItemList from './ItemList.js';
import ShopInfo from './ShopInfo.js';
import {
    type GameState,
    SHOP_COMMANDS,
    SHOP_ITEMS,
} from '../types/index.js';
import { useShopState } from '../hooks/useShopState.js';

type Props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
};

export default function ShopScreen({ state, setState, changeScene }: Props) {
    const { moveMenuItem, selectMenuItem, selectItem, goBackToMenu } =
        useShopState({ state, setState, changeScene });

    const { shop } = state;

    useInput((_input, key) => {
        if (key.upArrow) {
            moveMenuItem('up');
        } else if (key.downArrow) {
            moveMenuItem('down');
        } else if (key.return) {
            if (shop.mode === 'menu') {
                selectMenuItem();
            } else {
                selectItem();
            }
        } else if (key.escape) {
            if (shop.mode !== 'menu') {
                goBackToMenu();
            }
        }
    });

    // 売る画面では所持品の半額を表示
    const sellItems = shop.inventory.map(item => ({
        ...item,
        price: Math.floor(item.price / 2),
    }));

    return (
        <Box flexDirection="column" width={60}>
            {/* Title */}
            <Box justifyContent="center">
                <Text bold color="magenta">
                    🏪 ぶきとぼうぐのみせ 🏪
                </Text>
            </Box>

            {/* Shop Message */}
            <BorderBox>
                <Text>{shop.shopMessage}</Text>
            </BorderBox>

            {/* Item List (shown in buy/sell mode) */}
            {shop.mode !== 'menu' && (
                <BorderBox>
                    {shop.mode === 'buy' ? (
                        <ItemList
                            items={SHOP_ITEMS}
                            selectedIndex={shop.selectedItemIndex}
                        />
                    ) : (
                        <ItemList
                            items={sellItems}
                            selectedIndex={shop.selectedItemIndex}
                        />
                    )}
                </BorderBox>
            )}

            {/* Bottom: Menu + Info */}
            <Box>
                <BorderBox flexGrow={1}>
                    {shop.mode === 'menu' ? (
                        <CommandMenu
                            items={SHOP_COMMANDS as unknown as string[]}
                            selectedIndex={shop.selectedMenuItem}
                        />
                    ) : (
                        <Box paddingX={1}>
                            <Text dimColor>Esc: もどる</Text>
                        </Box>
                    )}
                </BorderBox>
                <BorderBox flexGrow={1}>
                    <ShopInfo gold={shop.gold} party={state.party} />
                </BorderBox>
            </Box>

            {/* Help */}
            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>↑↓: 選択 Enter: 決定 Esc: もどる Ctrl+C: 終了</Text>
            </Box>
        </Box>
    );
}
