
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
            if (activeTab === 'dashboard') {
                // Dashboard side scrolling (shift days)
                setScrollIndex(prev => Math.max(0, prev - 1));
            } else {
                setScrollIndex(prev => Math.max(0, prev - 1));
            }
        } else if (key.downArrow) {
            const maxRows =
                activeTab === 'history' ? reversedTransactions.length :
                    activeTab === 'analysis' ? itemAnalysis.length :
                        activeTab === 'dashboard' ? Math.max(0, dailyAnalysis.length - 30) : 0; // Approx visible width

            // standard scrolling
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
        // Vertical Stacked Bar Chart
        const CHART_HEIGHT = 10;
        const CHART_WIDTH_DAYS = 30; // Max days to show on screen

        // Prepare data: last N days, or respecting scroll?
        // Let's just show the last N days for simplicity in "Dashboard" mode, or use scroll to shift the window.
        // Assuming dailyAnalysis is sorted by day ascending.

        // Use scrollIndex to window the data if we have many days
        // scrollIndex 0 = show latest? or show from day 1?
        // Usually dashboards show latest data by default.
        // Let's make it so it shows the *latest* days, and scrolling moves back in time?
        // Or standard: scrollIndex determines *start* index.
        // Let's start with showing the LATEST data (end of array) by default.
        // But for consistency with other tabs, scrollIndex usually starts at 0 (top/start).
        // Let's stick to simple slicing: standard list logic? 
        // No, user wants X-axis date.
        // Let's slice based on scrollIndex, up to CHART_WIDTH_DAYS.

        const startIndex = Math.max(0, dailyAnalysis.length - CHART_WIDTH_DAYS - scrollIndex);
        const endIndex = Math.min(dailyAnalysis.length, startIndex + CHART_WIDTH_DAYS);
        const visibleData = dailyAnalysis.slice(startIndex, endIndex);

        if (visibleData.length === 0) {
            return <Box flexGrow={1} alignItems="center" justifyContent="center"><Text dimColor>データなし</Text></Box>;
        }

        // Auto Scale Logic
        const maxValRaw = Math.max(1, ...visibleData.map(d => Math.max(d.totalSales, d.profit)));
        const getNiceMax = (num: number) => {
            if (num <= 0) return 100;
            const digits = Math.floor(Math.log10(num));
            const base = Math.pow(10, digits);
            const lead = num / base;
            let shadow;
            if (lead <= 1) shadow = 1;
            else if (lead <= 2) shadow = 2;
            else if (lead <= 5) shadow = 5;
            else shadow = 10;
            return shadow * base;
        };
        const maxVal = getNiceMax(maxValRaw);

        const rows: React.ReactNode[] = [];

        // Build Rows (Top to Bottom)
        for (let i = CHART_HEIGHT - 1; i >= 0; i--) {

            const yLabel = i === CHART_HEIGHT - 1 ? maxVal.toString() :
                i === 0 ? "0" :
                    i === Math.floor(CHART_HEIGHT / 2) ? Math.floor(maxVal / 2).toString() : "";

            const rowCells = visibleData.map(d => {
                const salesHeight = (d.totalSales / maxVal) * CHART_HEIGHT;
                const profitHeight = (d.profit / maxVal) * CHART_HEIGHT; // Profit could be negative?

                // Simplified: assuming positive profit for stacking visualization
                // If negative profit, maybe show red block at bottom?
                // Visualizing: Stacked [Profit][Cost] = Sales
                // So Profit is at the bottom, Sales is Total Height.

                const isProfit = i < profitHeight;
                const isSales = i < salesHeight;

                if (isProfit && d.profit > 0) return <Text key={d.day} color="green">█</Text>;
                if (isSales) return <Text key={d.day} color="cyan">░</Text>; // Cost portion
                if (d.profit < 0 && i === 0) return <Text key={d.day} color="red">█</Text>; // Indicate loss at bottom row
                return <Text key={d.day} dimColor>·</Text>;
            });

            rows.push(
                <Box key={i} flexDirection="row">
                    <Box width={6} justifyContent="flex-end" marginRight={1}>
                        <Text dimColor>{yLabel}</Text>
                    </Box>
                    <Box flexDirection="row">
                        {rowCells}
                    </Box>
                </Box>
            );
        }

        // X-Axis Labels (Day)
        // Show every 2nd or 3rd day to save space if needed, or vertical? 
        // Let's just show last digit for each column to align perfectly.
        const xLabels = visibleData.map(d => {
            const dayStr = d.day.toString();
            const label = dayStr.length > 1 ? dayStr.slice(-1) : dayStr;
            return <Text key={d.day} dimColor>{label}</Text>;
        });

        return (
            <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
                {/* Chart Area */}
                <Box flexDirection="column">
                    {rows}
                </Box>
                {/* X Axis Line */}
                <Box flexDirection="row" marginLeft={7}>
                    <Text dimColor>{'─'.repeat(visibleData.length)}</Text>
                </Box>
                {/* X Axis Labels */}
                <Box flexDirection="row" marginLeft={7}>
                    {xLabels}
                </Box>
                {/* Legend */}
                <Box marginTop={1} marginLeft={4} flexDirection="row" gap={2}>
                    <Text color="green">█ 利益 (Profit)</Text>
                    <Text color="cyan">░ 原価 (Cost)</Text>
                    <Text dimColor>全高 = 売上 (Sales)</Text>
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
