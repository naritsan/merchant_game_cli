
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
type DashboardMode = 'menu' | 'graph' | 'metrics';

export default function LedgerScreen({ state, changeScene }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('history');
    const [scrollIndex, setScrollIndex] = useState(0);
    const [dashboardMode, setDashboardMode] = useState<DashboardMode>('menu');
    const [dashboardMenuIndex, setDashboardMenuIndex] = useState(0);

    // Analysis specific state
    const [analysisIndex, setAnalysisIndex] = useState(0);
    const [showAnalysisDetail, setShowAnalysisDetail] = useState(false);

    // Data aggregation
    const reversedTransactions = useMemo(() => [...state.transactions].reverse(), [state.transactions]);

    const itemAnalysis = useMemo(() => {
        const raw = aggregateByItem(state.transactions);
        return raw.map(a => {
            const profit = a.totalSales - a.totalCost;
            const margin = a.totalSales > 0 ? (profit / a.totalSales) * 100 : 0;
            return { ...a, profit, margin };
        }).sort((a, b) => b.margin - a.margin);
    }, [state.transactions]);

    const dailyAnalysis = useMemo(() => aggregateByDay(state.transactions, state.day), [state.transactions, state.day]);

    const VISIBLE_ROWS = 10;

    useInput((_input, key) => {
        // Global Navigation
        if (!showAnalysisDetail && key.rightArrow && (activeTab !== 'dashboard' || dashboardMode === 'menu')) {
            if (activeTab === 'history') setActiveTab('analysis');
            else if (activeTab === 'analysis') setActiveTab('dashboard');
            setScrollIndex(0);
            return;
        }
        if (!showAnalysisDetail && key.leftArrow && (activeTab !== 'dashboard' || dashboardMode === 'menu')) {
            if (activeTab === 'analysis') setActiveTab('history');
            else if (activeTab === 'dashboard') setActiveTab('analysis');
            setScrollIndex(0);
            return;
        }

        if (key.escape || (key.ctrl && _input === 'c')) {
            if (showAnalysisDetail) {
                setShowAnalysisDetail(false);
            } else if (activeTab === 'dashboard' && dashboardMode !== 'menu') {
                setDashboardMode('menu');
            } else {
                changeScene('menu');
            }
            return;
        }

        // Tab Specific Navigation
        if (activeTab === 'dashboard') {
            if (dashboardMode === 'menu') {
                if (key.upArrow) setDashboardMenuIndex(prev => Math.max(0, prev - 1));
                if (key.downArrow) setDashboardMenuIndex(prev => Math.min(1, prev + 1));
                if (key.return) {
                    if (dashboardMenuIndex === 0) setDashboardMode('graph');
                    if (dashboardMenuIndex === 1) setDashboardMode('metrics');
                }
            } else if (dashboardMode === 'graph') {
                if (key.upArrow) setScrollIndex(prev => Math.max(0, prev - 1)); // Scroll back in time (days)
                if (key.downArrow) setScrollIndex(prev => Math.max(0, prev + 1)); // Scroll forward
            }
            // Metrics mode has no scroll currently
        } else if (activeTab === 'analysis') {
            if (showAnalysisDetail) return;

            if (key.upArrow) {
                setAnalysisIndex(prev => Math.max(0, prev - 1));
            } else if (key.downArrow) {
                setAnalysisIndex(prev => Math.min(itemAnalysis.length - 1, prev + 1));
            } else if (key.return) {
                if (itemAnalysis.length > 0) setShowAnalysisDetail(true);
            }
        } else {
            // History Scrolling
            if (key.upArrow) {
                setScrollIndex(prev => Math.max(0, prev - 1));
            } else if (key.downArrow) {
                setScrollIndex(prev => Math.min(Math.max(0, reversedTransactions.length - VISIBLE_ROWS), prev + 1));
            }
        }
    });

    // Auto-scroll logic for Analysis cursor
    const analysisScroll = Math.max(0, analysisIndex - VISIBLE_ROWS + 1);
    const analysisVisible = useMemo(() => {
        const start = Math.min(analysisScroll, Math.max(0, itemAnalysis.length - VISIBLE_ROWS));
        return itemAnalysis.slice(start, start + VISIBLE_ROWS);
    }, [itemAnalysis, analysisScroll]);

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

    const renderAnalysisDetail = () => {
        const item = itemAnalysis[analysisIndex];
        if (!item) return null;

        return (
            <Box flexDirection="column" paddingX={2} paddingY={1} flexGrow={1}>
                <Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={2}>
                    <Text bold color="cyan">{item.itemName} の詳細</Text>
                    <Box marginTop={1} flexDirection="column">
                        <Box justifyContent="space-between"><Text>販売数:</Text><Text bold>{item.salesCount} 個</Text></Box>
                        <Box justifyContent="space-between"><Text>仕入総数:</Text><Text>{item.purchaseCount} 個</Text></Box>
                        <Box justifyContent="space-between"><Text>売上総額:</Text><Text color="yellow">{item.totalSales} G</Text></Box>
                        <Box justifyContent="space-between"><Text>売上原価:</Text><Text color="red">{item.totalCost} G</Text></Box>
                        <Box justifyContent="space-between"><Text>総利益:</Text><Text color="green">{item.profit} G</Text></Box>
                        <Box justifyContent="space-between"><Text>平均仕入単価:</Text><Text>{item.purchaseCount > 0 ? item.averagePurchasePrice : '-'} G</Text></Box>
                        <Box justifyContent="space-between"><Text>売値平均:</Text><Text>{item.salesCount > 0 ? item.averageSellPrice : '-'} G</Text></Box>
                        <Box justifyContent="space-between"><Text>平均利益率:</Text><Text bold color="green">{item.margin.toFixed(1)} %</Text></Box>
                    </Box>
                </Box>
                <Box marginTop={1} justifyContent="center">
                    <Text dimColor>Esc: リストに戻る</Text>
                </Box>
            </Box>
        );
    };

    const renderAnalysis = () => {
        if (showAnalysisDetail) return renderAnalysisDetail();

        return (
            <Box flexDirection="column" flexGrow={1}>
                <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor="gray">
                    <Box width={16}><Text dimColor>品名</Text></Box>
                    <Box width={12} justifyContent="flex-end"><Text dimColor>売上総額</Text></Box>
                    <Box width={10} justifyContent="flex-end"><Text dimColor>売値平均</Text></Box>
                    <Box width={14} justifyContent="flex-end"><Text dimColor>平均利益率</Text></Box>
                </Box>
                {itemAnalysis.length === 0 ? (
                    <Box flexGrow={1} alignItems="center" justifyContent="center"><Text dimColor>データなし</Text></Box>
                ) : (
                    analysisVisible.map((a) => {
                        const globalIdx = itemAnalysis.indexOf(a);
                        const isSelected = globalIdx === analysisIndex;
                        const marginColor = a.margin >= 20 ? 'green' : a.margin > 0 ? 'white' : 'red';
                        const textColor = isSelected ? 'yellow' : undefined;

                        return (
                            <Box key={a.itemId}>
                                <Box width={16}><Text color={textColor} bold={isSelected} wrap="truncate-end">{isSelected ? '▶' : '  '}{a.itemName}</Text></Box>
                                <Box width={12} justifyContent="flex-end"><Text color={textColor} bold={isSelected}>{a.totalSales} G</Text></Box>
                                <Box width={10} justifyContent="flex-end"><Text color={textColor} bold={isSelected}>{a.salesCount > 0 ? a.averageSellPrice : '-'} G</Text></Box>
                                <Box width={14} justifyContent="flex-end"><Text color={isSelected ? 'yellow' : marginColor} bold={isSelected}>{a.margin.toFixed(1)} %</Text></Box>
                            </Box>
                        );
                    })
                )}
            </Box>
        );
    };

    const renderDashboardMenu = () => {
        return (
            <Box flexDirection="column" flexGrow={1} justifyContent="center" alignItems="center">
                <Box flexDirection="column" borderStyle="round" borderColor="white" paddingX={2} paddingY={1}>
                    <Box marginBottom={1}><Text bold>ダッシュボード メニュー</Text></Box>
                    <Box>
                        <Text color={dashboardMenuIndex === 0 ? "green" : "white"}>
                            {dashboardMenuIndex === 0 ? "▶ " : "  "}📊 売上推移グラフ
                        </Text>
                    </Box>
                    <Box>
                        <Text color={dashboardMenuIndex === 1 ? "green" : "white"}>
                            {dashboardMenuIndex === 1 ? "▶ " : "  "}🔢 経営指標 (Metrics)
                        </Text>
                    </Box>
                </Box>
            </Box>
        );
    };

    const renderSalesGraph = () => {
        const CHART_HEIGHT = 10;
        const CHART_WIDTH_DAYS = 30;

        const startIndex = Math.max(0, dailyAnalysis.length - CHART_WIDTH_DAYS - scrollIndex);
        const endIndex = Math.min(dailyAnalysis.length, startIndex + CHART_WIDTH_DAYS);
        const visibleData = dailyAnalysis.slice(startIndex, endIndex);

        if (visibleData.length === 0) {
            return <Box flexGrow={1} alignItems="center" justifyContent="center"><Text dimColor>データなし</Text></Box>;
        }

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

        for (let i = CHART_HEIGHT - 1; i >= 0; i--) {
            const yLabel = i === CHART_HEIGHT - 1 ? maxVal.toString() :
                i === 0 ? "0" :
                    i === Math.floor(CHART_HEIGHT / 2) ? Math.floor(maxVal / 2).toString() : "";

            const rowCells = visibleData.map(d => {
                const salesHeight = (d.totalSales / maxVal) * CHART_HEIGHT;
                const profitHeight = (d.profit / maxVal) * CHART_HEIGHT;

                const isProfit = i < profitHeight;
                const isSales = i < salesHeight;

                if (isProfit && d.profit > 0) return <Text key={d.day} color="green">█</Text>;
                if (isSales) return <Text key={d.day} color="cyan">█</Text>; // Cost
                if (d.profit < 0 && i === 0) return <Text key={d.day} color="red">█</Text>;
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

        const xLabels = visibleData.map(d => {
            const dayStr = d.day.toString();
            const label = dayStr.length > 1 ? dayStr.slice(-1) : dayStr;
            return <Text key={d.day} dimColor>{label}</Text>;
        });

        return (
            <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
                <Box flexDirection="column">
                    {rows}
                </Box>
                <Box flexDirection="row" marginLeft={7}>
                    <Text dimColor>{'─'.repeat(visibleData.length)}</Text>
                </Box>
                <Box flexDirection="row" marginLeft={7}>
                    {xLabels}
                </Box>
                <Box marginTop={1} marginLeft={4} flexDirection="row" gap={2}>
                    <Text color="green">█ 利益</Text>
                    <Text color="cyan">█ 原価</Text>
                    <Text dimColor>(Esc: 戻る)</Text>
                </Box>
            </Box>
        );
    };

    const renderMetrics = () => {
        // Calculate Metrics
        const totalSales = dailyAnalysis.reduce((sum, d) => sum + d.totalSales, 0);
        const totalProfit = dailyAnalysis.reduce((sum, d) => sum + d.profit, 0);
        const totalMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

        const last7Days = dailyAnalysis.slice(Math.max(0, dailyAnalysis.length - 7));
        const last7Sales = last7Days.reduce((sum, d) => sum + d.totalSales, 0);
        const last7Profit = last7Days.reduce((sum, d) => sum + d.profit, 0);
        const last7Margin = last7Sales > 0 ? (last7Profit / last7Sales) * 100 : 0;

        const totalTransactions = dailyAnalysis.reduce((sum, d) => sum + d.transactionCount, 0);
        const avgCustomerSpend = totalTransactions > 0 ? Math.floor(totalSales / totalTransactions) : 0;

        const maxSalesDay = [...dailyAnalysis].sort((a, b) => b.totalSales - a.totalSales)[0];
        const maxProfitDay = [...dailyAnalysis].sort((a, b) => b.profit - a.profit)[0];

        return (
            <Box flexDirection="column" flexGrow={1} paddingX={2} paddingTop={0}>
                <Box flexDirection="row" justifyContent="space-between" marginBottom={0}>
                    <Box flexDirection="column" width="48%">
                        <Text bold color="blue" underline>全期間実績</Text>
                        <Box justifyContent="space-between"><Text>総売上:</Text><Text>{totalSales} G</Text></Box>
                        <Box justifyContent="space-between"><Text>総利益:</Text><Text>{totalProfit} G</Text></Box>
                        <Box justifyContent="space-between"><Text>粗利率:</Text><Text>{totalMargin.toFixed(1)} %</Text></Box>
                    </Box>
                    <Box flexDirection="column" width="48%">
                        <Text bold color="cyan" underline>直近7日間</Text>
                        <Box justifyContent="space-between"><Text>売上:</Text><Text>{last7Sales} G</Text></Box>
                        <Box justifyContent="space-between"><Text>利益:</Text><Text>{last7Profit} G</Text></Box>
                        <Box justifyContent="space-between"><Text>粗利率:</Text><Text>{last7Margin.toFixed(1)} %</Text></Box>
                    </Box>
                </Box>

                <Box flexDirection="column" marginTop={1}>
                    <Text bold color="magenta" underline>その他指標</Text>
                    <Box justifyContent="space-between">
                        <Text>客単価 (平均):</Text>
                        <Text bold>{avgCustomerSpend} G</Text>
                    </Box>
                    <Box justifyContent="space-between">
                        <Text>最高売上:</Text>
                        <Text>{maxSalesDay ? `${maxSalesDay.day}日目 (${maxSalesDay.totalSales} G)` : '-'}</Text>
                    </Box>
                    <Box justifyContent="space-between">
                        <Text>最高利益:</Text>
                        <Text>{maxProfitDay ? `${maxProfitDay.day}日目 (${maxProfitDay.profit} G)` : '-'}</Text>
                    </Box>
                </Box>
            </Box>
        );
    }

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
            <BorderBox height={16} flexDirection="column">
                {activeTab === 'history' && renderHistory()}
                {activeTab === 'analysis' && renderAnalysis()}
                {activeTab === 'dashboard' && (
                    dashboardMode === 'menu' ? renderDashboardMenu() :
                        dashboardMode === 'graph' ? renderSalesGraph() : renderMetrics()
                )}
            </BorderBox>

            <Box justifyContent="center" marginTop={0}>
                {activeTab === 'analysis' && !showAnalysisDetail && <Text dimColor>↑↓: 選択  Enter: 詳細  Esc: 戻る</Text>}
                {activeTab === 'analysis' && showAnalysisDetail && <Text dimColor>Esc: リストに戻る</Text>}
                {activeTab === 'history' && <Text dimColor>↑↓: スクロール  Esc: 戻る</Text>}
                {activeTab === 'dashboard' && dashboardMode === 'menu' && <Text dimColor>←→: タブ切替  Enter: 決定  Esc: 戻る</Text>}
                {activeTab === 'dashboard' && dashboardMode !== 'menu' && <Text dimColor>Esc: メニューへ戻る</Text>}
            </Box>
        </Box>
    );
}
