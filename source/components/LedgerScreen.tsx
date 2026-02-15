
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
                    <Box width={16}><Text dimColor>品名</Text></Box>
                    <Box width={6} justifyContent="flex-end"><Text dimColor>販売数</Text></Box>
                    <Box width={10} justifyContent="flex-end"><Text dimColor>仕入平均</Text></Box>
                    <Box width={10} justifyContent="flex-end"><Text dimColor>売値平均</Text></Box>
                    <Box width={10} justifyContent="flex-end"><Text dimColor>利益</Text></Box>
                </Box>
                {visibleData.length === 0 ? (
                    <Box flexGrow={1} alignItems="center" justifyContent="center"><Text dimColor>データなし</Text></Box>
                ) : (
                    visibleData.map((a) => {
                        const profit = a.totalSales - a.totalCost;
                        const profitColor = profit > 0 ? 'green' : profit < 0 ? 'red' : 'white';

                        return (
                            <Box key={a.itemId}>
                                <Box width={16}><Text wrap="truncate-end">{a.itemName}</Text></Box>
                                <Box width={6} justifyContent="flex-end"><Text>{a.salesCount}</Text></Box>
                                <Box width={10} justifyContent="flex-end"><Text>{a.purchaseCount > 0 ? a.averagePurchasePrice : '-'}G</Text></Box>
                                <Box width={10} justifyContent="flex-end"><Text>{a.salesCount > 0 ? a.averageSellPrice : '-'}G</Text></Box>
                                <Box width={10} justifyContent="flex-end"><Text color={profitColor}>{profit}G</Text></Box>
                            </Box>
                        );
                    })
                )}
            </Box>
        );
    };

    const renderDashboard = () => {
        // Line Chart Implementation
        const height = 10;
        const width = 50;

        // Get data for the last 'width' days or all available data if less
        // For simplicity in this text-based chart, let's show the last N days that fit
        // But since we have scrollIndex, maybe we stick to the scrolling list? 
        // No, the user wants a chart "Dashboard". A fixed chart is better than a scrolling list for a "Dashboard" feel.
        // Let's use the visible data logic but map it to a chart.

        // Actually, looking at the previous implementation, it was a list of days with bars.
        // The user wants "Line Chart".
        // Let's try to fit as many days as possible in the width.
        const visibleData = dailyAnalysis.slice(Math.max(0, dailyAnalysis.length - width), dailyAnalysis.length);

        if (visibleData.length === 0) {
            return <Box flexGrow={1} alignItems="center" justifyContent="center"><Text dimColor>データなし</Text></Box>;
        }

        const maxVal = Math.max(1, ...visibleData.map(d => Math.max(d.totalSales, d.profit)));
        const minVal = Math.min(0, ...visibleData.map(d => Math.min(d.totalSales, d.profit))); // Allow negative profit
        const range = maxVal - minVal;

        // Generate the grid
        const rows: React.ReactNode[] = [];

        // Y-axis labels and chart rows
        for (let i = height - 1; i >= 0; i--) {
            const yVal = minVal + (range * (i / (height - 1)));
            const yLabel = Math.floor(yVal).toString().padStart(6, ' ');

            const rowChars = visibleData.map(d => {
                // Normalize data to 0..(height-1)
                const salesY = Math.floor(((d.totalSales - minVal) / range) * (height - 1));
                const profitY = Math.floor(((d.profit - minVal) / range) * (height - 1));

                if (i === salesY && i === profitY) return <Text key={d.day} color="yellow">X</Text>; // Overlap
                if (i === salesY) return <Text key={d.day} color="cyan">S</Text>;
                if (i === profitY) return <Text key={d.day} color="green">P</Text>;
                if (Math.abs(yVal - 0) < range / height / 2) return <Text key={d.day} dimColor>-</Text>; // Zero line
                return <Text key={d.day} dimColor>·</Text>;
            });

            rows.push(
                <Box key={i} flexDirection="row">
                    <Text dimColor>{yLabel} | </Text>
                    {rowChars}
                </Box>
            );
        }

        // X-axis labels (Days) - simplified, show every 5th day or so if crowded
        // For now, just last digit of day? or just specific ticks?
        // Let's try to show day number vertically or just every few days.
        const xLabels = (
            <Box flexDirection="row" marginLeft={9}>
                {visibleData.map((d, i) => (
                    <Text key={d.day} dimColor>{d.day % 5 === 0 || i === 0 || i === visibleData.length - 1 ? d.day.toString().padEnd(1, ' ').slice(-1) : ' '}</Text>
                ))}
            </Box>
        );

        return (
            <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
                {rows}
                <Box borderStyle="single" borderTop={true} borderLeft={false} borderRight={false} borderBottom={false} borderColor="gray" marginLeft={8} width={visibleData.length + 2} />
                {xLabels}
                <Box marginTop={1} flexDirection="row" gap={2}>
                    <Text color="cyan">S: 売上</Text>
                    <Text color="green">P: 利益</Text>
                </Box>
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
