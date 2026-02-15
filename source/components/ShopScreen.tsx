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
import { useAcceleratedValue } from '../hooks/useAcceleratedValue.js';
import { getPurchaseCostMultiplier } from '../utils/luckUtils.js';
import { getItem, getAllItems } from '../types/items.js';

type Props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    advanceTime: (minutes: number) => void;
};

export default function ShopScreen({ state, setState, changeScene, advanceTime }: Props) {
    const { moveMenuItem, selectMenuItem, selectItem, goBackToMenu, exitShop, changeTab, buyItem } =
        useShopState({ state, setState, changeScene, advanceTime });

    const { shop } = state;
    const { value: quantity, setValue: setQuantity, change: changeQuantity } = useAcceleratedValue(1, 1, 99);

    useInput((_input, key) => {
        if (shop.mode === 'buy_quantity') {
            if (key.upArrow) changeQuantity(1);
            if (key.downArrow) changeQuantity(-1);
            if (key.leftArrow) changeQuantity(-10);
            if (key.rightArrow) changeQuantity(10);
            if (key.return) {
                const item = getAllItems().filter(i => i.type !== 'item' && i.type !== 'weapon' && i.type !== 'armor' ? false : true)[shop.selectedItemIndex];
                if (item) {
                    buyItem(item.id, quantity);
                    setQuantity(1);
                }
            }
            if (key.escape) {
                setState(prev => ({ ...prev, shop: { ...prev.shop, mode: 'buy' } }));
            }
            return;
        }

        if (key.upArrow) {
            moveMenuItem('up');
        } else if (key.downArrow) {
            moveMenuItem('down');
        } else if (key.leftArrow || key.rightArrow) {
            if (shop.mode === 'sell') {
                const nextTab = shop.sellTab === 'possessions' ? 'stock' : 'possessions';
                changeTab(nextTab);
            }
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

    const currentSellItems = shop.sellTab === 'possessions' ? state.possessions : state.stock;
    const sellItems = currentSellItems.map(p => {
        const itemData = getItem(p.itemId);
        return {
            ...itemData,
            price: Math.floor(itemData.price / 2),
            name: `${itemData.name} x${p.quantity}`,
        };
    });

    const shopItemsList = getAllItems().filter(i => i.type !== 'item' && i.type !== 'weapon' && i.type !== 'armor' ? false : true);

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

            {/* Item List (shown in buy/sell/buy_quantity mode) */}
            {shop.mode !== 'menu' && (
                <BorderBox>
                    {shop.mode === 'buy' || shop.mode === 'buy_quantity' ? (
                        <Box flexDirection="row" width="100%">
                            <Box flexDirection="column" width="55%">
                                <Text bold underline>商品リスト (卸値)</Text>
                                <ItemList
                                    items={shopItemsList}
                                    selectedIndex={shop.selectedItemIndex}
                                    renderItem={(item) => {
                                        const price = Math.floor(item.price * 0.9 * getPurchaseCostMultiplier(state.luck));
                                        return `${item.name} ${price} G`;
                                    }}
                                />
                                {shop.mode === 'buy_quantity' && (
                                    <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="yellow">
                                        <Text bold> 購入個数: <Text color="yellow">{quantity}</Text></Text>
                                        <Text dimColor> ↑↓:±1 ←→:±10 Enter:決定</Text>
                                    </Box>
                                )}
                            </Box>
                            <Box flexDirection="column" width="45%" paddingLeft={1}>
                                <Text bold underline>現在の在庫 (Stock)</Text>
                                {state.stock.length === 0 ? (
                                    <Text dimColor>なし</Text>
                                ) : (
                                    state.stock.map((s, i) => {
                                        const itemData = getItem(s.itemId);
                                        return (
                                            <Text key={i} dimColor={s.quantity === 0}>
                                                {itemData.name} x{s.quantity}
                                            </Text>
                                        );
                                    })
                                )}
                            </Box>
                        </Box>
                    ) : (
                        <Box flexDirection="column" width="100%">
                            <Box flexDirection="row" justifyContent="center" marginBottom={1}>
                                <Text color={shop.sellTab === 'possessions' ? 'cyan' : 'gray'} bold={shop.sellTab === 'possessions'}>
                                    {shop.sellTab === 'possessions' ? '● ' : '  '}手持ち
                                </Text>
                                <Text>  |  </Text>
                                <Text color={shop.sellTab === 'stock' ? 'yellow' : 'gray'} bold={shop.sellTab === 'stock'}>
                                    {shop.sellTab === 'stock' ? '● ' : '  '}在庫
                                </Text>
                            </Box>
                            <ItemList
                                items={sellItems}
                                selectedIndex={shop.selectedItemIndex}
                            />
                        </Box>
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
                        <Box paddingX={1} flexDirection="column">
                            <Text dimColor>Esc: もどる</Text>
                            {shop.mode === 'sell' && <Text dimColor>←→: タブ切替</Text>}
                        </Box>
                    )}
                </BorderBox>
                <BorderBox flexGrow={1}>
                    <ShopInfo gold={state.gold} possessions={state.possessions} party={state.party} />
                </BorderBox>
            </Box>

            {/* Help */}
            <Box justifyContent="center" marginTop={1}>
                {shop.mode === 'buy_quantity' ? (
                    <Text dimColor>↑↓: 個数変更  Enter: 購入  Esc: キャンセル</Text>
                ) : (
                    <Text dimColor>↑↓: 選択  Enter: 決定  Esc: もどる  Ctrl+C: 終了</Text>
                )}
            </Box>
        </Box>
    );
}
