
import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import { GameState } from '../types/index.js';
import { getItem } from '../types/items.js';
import { aggregateByItem, aggregateByDay } from '../utils/ledgerUtils.js';

type Props = {
    state: GameState;
    changeScene: (scene: GameState['scene']) => void;
};

type Tab = 'history' | 'analysis' | 'dashboard';

export default function LedgerScreen({ state, changeScene }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('history');
    const [scrollIndex, setScrollIndex] = useState(0);

    // Data aggregation
    const reversedTransactions = useMemo(() => [...state.transactions].reverse(), [state.transactions]);
    const itemAnalysis = useMemo(() => aggregateByItem(state.transactions), [state.transactions]);
    const dailyAnalysis = useMemo(() => aggregateByDay(state.transactions, state.day), [state.transactions, state.day]);

    const VISIBLE_ROWS = 10;

    useInput((_input, key) => {
        if (key.escape || (key.ctrl && _input === 'c')) {
            changeScene('menu');
            return;
        }

        if (key.leftArrow) {
            if (activeTab === 'analysis') setActiveTab('history');
            else if (activeTab === 'dashboard') setActiveTab('analysis');
            setScrollIndex(0);
        } else if (key.rightArrow) {
            if (activeTab === 'history') setActiveTab('analysis');
            else if (activeTab === 'analysis') setActiveTab('dashboard');
            setScrollIndex(0);
        }

        if (key.upArrow) {
            setScrollIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            const maxRows =
                activeTab === 'history' ? reversedTransactions.length :
                    activeTab === 'analysis' ? itemAnalysis.length :
                        activeTab === 'dashboard' ? dailyAnalysis.length : 0;

            setScrollIndex(prev => Math.min(Math.max(0, maxRows - VISIBLE_ROWS), prev + 1));
        }
    });

    const renderTabs = () => (
        <Box flexDirection="row" justifyContent="space-around" borderStyle="single" borderBottom={false} borderLeft={false} borderRight={false} borderTop={false} marginBottom={0}>
            <Text color={activeTab === 'history' ? 'green' : 'gray'} bold={activeTab === 'history'}>
                {activeTab === 'history' ? '● ' : '  '}取引履歴
            </Text>
            <Text color={activeTab === 'analysis' ? 'cyan' : 'gray'} bold={activeTab === 'analysis'}>
                {activeTab === 'analysis' ? '● ' : '  '}商品分析
            </Text>
            <Text color={activeTab === 'dashboard' ? 'yellow' : 'gray'} bold={activeTab === 'dashboard'}>
                {activeTab === 'dashboard' ? '● ' : '  '}ダッシュボード
            </Text>
        </Box>
    );

    const renderHistory = () => {
        const visibleData = reversedTransactions.slice(scrollIndex, scrollIndex + VISIBLE_ROWS);
        return (
            <Box flexDirection="column" flexGrow={1}>
                <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor="gray">
                    <Box width={12}><Text dimColor>日時</Text></Box>
                    <Box width={6}><Text dimColor>種別</Text></Box>
                    <Box width={16}><Text dimColor>品名</Text></Box>
                    <Box width={4} justifyContent="flex-end"><Text dimColor>個</Text></Box>
                    <Box width={8} justifyContent="flex-end"><Text dimColor>単価</Text></Box>
                    <Box width={12} justifyContent="flex-end"><Text dimColor>相手</Text></Box>
                </Box>
                {visibleData.length === 0 ? (
                    <Box flexGrow={1} alignItems="center" justifyContent="center"><Text dimColor>取引なし</Text></Box>
                ) : (
                    visibleData.map((t) => {
                        const itemName = getItem(t.itemId).name;
                        const typeColor = t.type === 'buy' ? 'red' : 'green';
                        const typeLabel = t.type === 'buy' ? '仕入' : '販売';
                        const timeStr = `${t.date.day}日 ${t.date.hour}:${t.date.minute.toString().padStart(2, '0')}`;

                        return (
                            <Box key={t.id}>
                                <Box width={12}><Text>{timeStr}</Text></Box>
                                <Box width={6}><Text color={typeColor}>{typeLabel}</Text></Box>
                                <Box width={16}><Text wrap="truncate-end">{itemName}</Text></Box>
                                <Box width={4} justifyContent="flex-end"><Text>{t.quantity}</Text></Box>
                                <Box width={8} justifyContent="flex-end"><Text>{t.price}G</Text></Box>
                                <Box width={12} justifyContent="flex-end"><Text wrap="truncate-end">{t.partner}</Text></Box>
                            </Box>
                        );
                    })
                )}
            </Box>
        );
    };

    const renderAnalysis = () => {
        const visibleData = itemAnalysis.slice(scrollIndex, scrollIndex + VISIBLE_ROWS);
        return (
            <Box flexDirection="column" flexGrow={1}>
                <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor="gray">
                    <Box width={18}><Text dimColor>品名</Text></Box>
                    <Box width={6} justifyContent="flex-end"><Text dimColor>件数</Text></Box>
                    <Box width={10} justifyContent="flex-end"><Text dimColor>平均単価</Text></Box>
                    <Box width={10} justifyContent="flex-end"><Text dimColor>総額</Text></Box>
                    <Box width={8} justifyContent="flex-end"><Text dimColor>収支</Text></Box>
                </Box>
                {visibleData.length === 0 ? (
                    <Box flexGrow={1} alignItems="center" justifyContent="center"><Text dimColor>データなし</Text></Box>
                ) : (
                    visibleData.map((a) => {
                        const profit = a.totalSales - a.totalCost;
                        const profitColor = profit > 0 ? 'green' : profit < 0 ? 'red' : 'white';

                        return (
                            <Box key={a.itemId}>
                                <Box width={18}><Text wrap="truncate-end">{a.itemName}</Text></Box>
                                <Box width={6} justifyContent="flex-end"><Text>{a.salesCount + a.purchaseCount}</Text></Box>
                                <Box width={10} justifyContent="flex-end"><Text>{a.salesCount > 0 ? a.averageSellPrice : '-'}G</Text></Box>
                                <Box width={10} justifyContent="flex-end"><Text>{a.totalSales}G</Text></Box>
                                <Box width={8} justifyContent="flex-end"><Text color={profitColor}>{profit}G</Text></Box>
                            </Box>
                        );
                    })
                )}
            </Box>
        );
    };

    const renderDashboard = () => {
        const visibleData = dailyAnalysis.slice(scrollIndex, scrollIndex + VISIBLE_ROWS);

        // Normalize bars
        // Find max value across visible rows for scaling
        const maxVal = Math.max(1, ...visibleData.map(d => Math.max(d.totalSales, Math.abs(d.profit))));
        const BAR_WIDTH = 15;

        return (
            <Box flexDirection="column" flexGrow={1}>
                <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor="gray">
                    <Box width={6}><Text dimColor>Day</Text></Box>
                    <Box width={8} justifyContent="flex-end"><Text dimColor>売上</Text></Box>
                    <Box width={8} justifyContent="flex-end"><Text dimColor>利益</Text></Box>
                    <Box width={30} paddingLeft={1}><Text dimColor>Graph(Sales|Profit)</Text></Box>
                </Box>
                {visibleData.length === 0 ? (
                    <Box flexGrow={1} alignItems="center" justifyContent="center"><Text dimColor>データなし</Text></Box>
                ) : (
                    visibleData.map((d) => {
                        const salesBarLen = Math.floor((d.totalSales / maxVal) * BAR_WIDTH);
                        const profitBarLen = Math.floor((Math.abs(d.profit) / maxVal) * BAR_WIDTH);
                        const profitColor = d.profit >= 0 ? 'green' : 'red';

                        return (
                            <Box key={d.day}>
                                <Box width={6}><Text>{d.day}日</Text></Box>
                                <Box width={8} justifyContent="flex-end"><Text>{d.totalSales}G</Text></Box>
                                <Box width={8} justifyContent="flex-end"><Text color={profitColor}>{d.profit}G</Text></Box>
                                <Box width={30} paddingLeft={1} flexDirection="row">
                                    <Box width={15}>
                                        <Text color="cyan">{'#'.repeat(salesBarLen)}</Text>
                                    </Box>
                                    <Box width={15}>
                                        <Text color={profitColor}>{d.profit >= 0 ? '+' : '-'}{'#'.repeat(profitBarLen)}</Text>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Box>
        );
    };

    return (
        <Box flexDirection="column" width={60}>
            {/* Header */}
            <Box justifyContent="center" marginBottom={1}>
                <Text bold color="magenta">
                    📈 経営帳簿 (Ledger) 📈
                </Text>
            </Box>

            {renderTabs()}

            {/* Main Content Area */}
            <BorderBox height={14} flexDirection="column">
                {activeTab === 'history' && renderHistory()}
                {activeTab === 'analysis' && renderAnalysis()}
                {activeTab === 'dashboard' && renderDashboard()}
            </BorderBox>

            <Box justifyContent="center" marginTop={1}>
                {activeTab === 'analysis' && <Text dimColor>※収支 = 総売上 - 総仕入 (在庫分含む)</Text>}
                <Text dimColor>←→: タブ切替  ↑↓: スクロール  Esc: 戻る</Text>
            </Box>
        </Box>
    );
}
