import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import { GameState, TransactionRecord } from '../types/index.js';
import { getItem } from '../types/items.js';

type Props = {
    state: GameState;
    changeScene: (scene: GameState['scene']) => void;
};

export default function LedgerScreen({ state, changeScene }: Props) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { transactions } = state;

    // 最新の取引を上に表示するために逆順にする
    const sortedTransactions = [...transactions].reverse();

    useInput((_input, key) => {
        if (key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setSelectedIndex(prev => Math.min(sortedTransactions.length - 1, prev + 1));
        } else if (key.escape || key.return) {
            changeScene('menu');
        }
    });

    const MAX_VISIBLE = 10;
    let start = 0;
    let end = sortedTransactions.length;

    if (sortedTransactions.length > MAX_VISIBLE) {
        const half = Math.floor(MAX_VISIBLE / 2);
        start = Math.max(0, selectedIndex - half);
        end = start + MAX_VISIBLE;
        if (end > sortedTransactions.length) {
            end = sortedTransactions.length;
            start = Math.max(0, end - MAX_VISIBLE);
        }
    }
    const visibleTransactions = sortedTransactions.slice(start, end);

    const renderTransaction = (record: TransactionRecord, _index: number, isSelected: boolean) => {
        const itemData = getItem(record.itemId);
        const dateStr = `${record.date.day}日 ${record.date.hour}:${record.date.minute.toString().padStart(2, '0')}`;
        const typeStr = record.type === 'buy' ? '仕入' : '販売';
        const color = record.type === 'buy' ? 'red' : 'green';
        const sign = record.type === 'buy' ? '-' : '+';

        return (
            <Box key={record.id} flexDirection="row" justifyContent="space-between">
                <Text color={isSelected ? 'yellow' : undefined}>
                    {isSelected ? '> ' : '  '}
                    {dateStr} [{typeStr}] {itemData.name} x{record.quantity}
                </Text>
                <Text color={color}>
                    {sign}{record.totalPrice} G
                </Text>
            </Box>
        );
    };

    // 簡易的な収支計算
    const totalSales = transactions
        .filter(t => t.type === 'sell')
        .reduce((sum, t) => sum + t.totalPrice, 0);

    const totalCost = transactions
        .filter(t => t.type === 'buy')
        .reduce((sum, t) => sum + t.totalPrice, 0);

    const profit = totalSales - totalCost;

    return (
        <Box flexDirection="column" width={60}>
            <Box justifyContent="center">
                <Text bold color="cyan">
                    📖 取引台帳 (Ledger) 📖
                </Text>
            </Box>

            <Box flexDirection="row" justifyContent="space-between" marginY={1}>
                {/* Summary Panel */}
                <BorderBox width={60} title="サマリー">
                    <Box justifyContent="space-around" width="100%">
                        <Box flexDirection="column" alignItems="center">
                            <Text>総売上</Text>
                            <Text color="green">+{totalSales} G</Text>
                        </Box>
                        <Box flexDirection="column" alignItems="center">
                            <Text>総仕入</Text>
                            <Text color="red">-{totalCost} G</Text>
                        </Box>
                        <Box flexDirection="column" alignItems="center">
                            <Text>純利益</Text>
                            <Text color={profit >= 0 ? 'green' : 'red'}>
                                {profit >= 0 ? '+' : ''}{profit} G
                            </Text>
                        </Box>
                    </Box>
                </BorderBox>
            </Box>

            {/* Transaction List */}
            <BorderBox title={`取引履歴 (${transactions.length}件)`}>
                <Box flexDirection="column" minHeight={10}>
                    {sortedTransactions.length === 0 ? (
                        <Text dimColor>取引履歴はありません</Text>
                    ) : (
                        visibleTransactions.map((record, i) =>
                            renderTransaction(record, start + i, start + i === selectedIndex)
                        )
                    )}
                </Box>
            </BorderBox>

            <Box justifyContent="center">
                <Text dimColor>Esc: もどる</Text>
            </Box>
        </Box>
    );
}
