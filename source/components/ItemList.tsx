import React from 'react';
import { Box, Text } from 'ink';
import { type Item } from '../types/index.js';

type Props = {
    items: Item[];
    selectedIndex: number;
    showPrice?: boolean;
    renderItem?: (item: Item) => React.ReactNode;
};

export default function ItemList({ items, selectedIndex, showPrice = true, renderItem }: Props) {
    if (items.length === 0) {
        return (
            <Box paddingX={1}>
                <Text dimColor>アイテムが ありません</Text>
            </Box>
        );
    }

    const MAX_VISIBLE_ITEMS = 6;
    let start = 0;
    let end = items.length;

    if (items.length > MAX_VISIBLE_ITEMS) {
        // 選択項目が中心に来るように表示範囲を計算
        const half = Math.floor(MAX_VISIBLE_ITEMS / 2);
        start = Math.max(0, selectedIndex - half);
        end = start + MAX_VISIBLE_ITEMS;

        // 末尾にはみ出す場合の補正
        if (end > items.length) {
            end = items.length;
            start = Math.max(0, end - MAX_VISIBLE_ITEMS);
        }
    }

    const visibleItems = items.slice(start, end);

    return (
        <Box flexDirection="column" paddingX={1}>
            {start > 0 && <Text dimColor>  ...</Text>}
            {visibleItems.map((item, i) => {
                const globalIndex = start + i;
                const isSelected = globalIndex === selectedIndex;

                let content: React.ReactNode;
                if (renderItem) {
                    content = renderItem(item);
                } else {
                    const priceText = showPrice
                        ? `${String(item.price).padStart(5, ' ')} G`
                        : '';
                    content = (
                        <>
                            {item.name}
                            {priceText ? `  ${priceText}` : ''}
                        </>
                    );
                }

                // 文字列や数値の場合はスタイルを適用するためにTextでラップする
                // 既にElement（Boxなど）の場合はそのまま表示する（Textでラップするとエラーになるため）
                const isTextContent = typeof content === 'string' || typeof content === 'number';

                return (
                    <Box key={`${item.name}-${globalIndex}`} flexDirection="row">
                        <Text color={isSelected ? 'yellow' : undefined} bold={isSelected}>
                            {isSelected ? '▶ ' : '  '}
                        </Text>

                        {isTextContent ? (
                            <Text color={isSelected ? 'yellow' : undefined} bold={isSelected}>
                                {content}
                            </Text>
                        ) : (
                            // コンポーネントの場合はそのまま描画（選択時の色はコンポーネント側で制御が必要だが、今回は矢印のみ色が変わる）
                            content
                        )}
                    </Box>
                );
            })}
            {end < items.length && <Text dimColor>  ...</Text>}
        </Box>
    );
}
