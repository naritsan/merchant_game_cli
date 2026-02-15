import React from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import CommandMenu from './CommandMenu.js';
import ItemList from './ItemList.js';
import ShopInfo from './ShopInfo.js';
import {
    type GameState,
    SHOP_COMMANDS,
} from '../types/index.js';
import { useShopState } from '../hooks/useShopState.js';
import { getPurchaseCostMultiplier } from '../utils/luckUtils.js';
import { getItem, getAllItems } from '../types/items.js';

type Props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

export default function ShopScreen({ state, setState, changeScene, advanceTime }: Props) {
    const { moveMenuItem, selectMenuItem, selectItem, goBackToMenu, exitShop } =
        useShopState({ state, setState, changeScene, advanceTime });

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
            } else {
                exitShop();
            }
        }
    });

    // 売る画面では所持品の半額を表示
    const sellItems = state.possessions.map(p => {
        const itemData = getItem(p.itemId);
        return {
            ...itemData,
            price: Math.floor(itemData.price / 2),
            name: `${itemData.name} x${p.quantity}`,
        };
    });

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
                        <Box flexDirection="row" width="100%">
                            <Box flexDirection="column" width="55%">
                                <Text bold underline>商品リスト (卸値)</Text>
                                <ItemList
                                    items={getAllItems()}
                                    selectedIndex={shop.selectedItemIndex}
                                    renderItem={(item) => {
                                        const price = Math.floor(item.price * 0.9 * getPurchaseCostMultiplier(state.luck));
                                        return `${item.name} ${price} G`;
                                    }}
                                />
                            </Box>
                            <Box flexDirection="column" width="45%" paddingLeft={1}>
                                <Text bold underline>もちもの</Text>
                                {state.possessions.length === 0 ? (
                                    <Text dimColor>なし</Text>
                                ) : (
                                    state.possessions.map((p, i) => {
                                        const itemData = getItem(p.itemId);
                                        return (
                                            <Text key={i} dimColor>
                                                {itemData.name} x{p.quantity}
                                            </Text>
                                        );
                                    })
                                )}
                            </Box>
                        </Box>
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
                    <ShopInfo gold={state.gold} possessions={state.possessions} party={state.party} />
                </BorderBox>
            </Box>

            {/* Help */}
            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>↑↓: 選択 Enter: 決定 Esc: もどる Ctrl+C: 終了</Text>
            </Box>
        </Box>
    );
}
