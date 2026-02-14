import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import { type GameState } from '../types/index.js';

type Props = {
    changeScene: (scene: GameState['scene']) => void;
};

type Category = 'Fortune' | 'Day' | 'Weather';

const FORTUNE_TIPS = [
    { label: '神の加護', color: 'yellow', effect: '全ての行動が最高の結果になる' },
    { label: '星の導き', color: 'yellow', effect: 'レアアイテムの出現率が大幅に上がる' },
    { label: '女神の祝福', color: 'green', effect: '売買価格が大幅に有利になる' },
    { label: '幸運', color: 'green', effect: '良いイベントが起きやすくなる' },
    { label: '平穏', color: 'white', effect: '特に影響なし' },
    { label: '不吉な予感', color: 'magenta', effect: '悪いイベントが起きやすくなる' },
    { label: '呪い', color: 'magenta', effect: '売買価格が不利になる' },
    { label: '破滅の兆し', color: 'red', effect: 'モンスターが強力になる' },
    { label: '黙示録', color: 'red', effect: '全ての行動が最悪の結果になる' },
];

const DAY_TIPS = [
    { label: '月曜', effect: '特になし（平穏な週の始まり）' },
    { label: '火曜', effect: '武器の需要増 (売上UP)' },
    { label: '水曜', effect: '道具の需要増 (売上UP)' },
    { label: '木曜', effect: '防具の需要増 (売上UP)' },
    { label: '金曜', effect: '客の予算増加 (高額商品販売のチャンス)' },
    { label: '土曜', effect: '客数増加 (薄利多売のチャンス)' },
    { label: '日曜', effect: '安息日 (店舗・仕入れ不可 / 休息の時間)' },
];

const WEATHER_TIPS = [
    { label: '快晴', icon: '☀', color: 'yellow', effect: '客足が安定する' },
    { label: '雨', icon: '☂', color: 'blue', effect: '客足が少し減るが、特定のアイテムが売れやすくなる' },
    { label: '雪', icon: '☃', color: 'white', effect: '客足が大幅に減るが、防具の需要が上がる' },
    { label: '嵐', icon: '⛈', color: 'red', effect: '客がほとんど来ないが、掘り出し物があるかも' },
    { label: 'オーロラ', icon: '🌌', color: 'magenta', effect: '全ての運気が上昇し、奇跡が起きる' },
];

export default function TipsScreen({ changeScene }: Props) {
    const [category, setCategory] = useState<Category>('Fortune');
    const categories: Category[] = ['Fortune', 'Day', 'Weather'];
    const categoryIndex = categories.indexOf(category);

    useInput((_input, key) => {
        if (key.return || key.escape) {
            changeScene('menu');
        } else if (key.leftArrow) {
            const nextIndex = (categoryIndex - 1 + categories.length) % categories.length;
            setCategory(categories[nextIndex]!);
        } else if (key.rightArrow) {
            const nextIndex = (categoryIndex + 1) % categories.length;
            setCategory(categories[nextIndex]!);
        }
    });

    const renderContent = () => {
        switch (category) {
            case 'Fortune':
                return (
                    <Box flexDirection="column">
                        <Text bold color="cyan">【運勢の効果】</Text>
                        <Text> </Text>
                        {FORTUNE_TIPS.map((tip) => (
                            <Box key={tip.label} marginBottom={0}>
                                <Box width={14}>
                                    <Text color={tip.color}>● {tip.label}:</Text>
                                </Box>
                                <Text>{tip.effect}</Text>
                            </Box>
                        ))}
                    </Box>
                );
            case 'Day':
                return (
                    <Box flexDirection="column">
                        <Text bold color="cyan">【曜日の効果】</Text>
                        <Text> </Text>
                        {DAY_TIPS.map((tip) => (
                            <Box key={tip.label} marginBottom={0}>
                                <Box width={10}>
                                    <Text color={tip.label === '日曜' ? 'red' : 'white'}>● {tip.label}:</Text>
                                </Box>
                                <Text>{tip.effect}</Text>
                            </Box>
                        ))}
                    </Box>
                );
            case 'Weather':
                return (
                    <Box flexDirection="column">
                        <Text bold color="cyan">【天気の効果】</Text>
                        <Text> </Text>
                        {WEATHER_TIPS.map((tip) => (
                            <Box key={tip.label} marginBottom={0}>
                                <Box width={12}>
                                    <Text color={tip.color}>{tip.icon} {tip.label}:</Text>
                                </Box>
                                <Text>{tip.effect}</Text>
                            </Box>
                        ))}
                    </Box>
                );
        }
    };

    return (
        <Box flexDirection="column" width={60}>
            {/* Category Tabs */}
            <Box justifyContent="center" marginBottom={0}>
                {categories.map((cat) => (
                    <Box key={cat} marginX={1}>
                        <Text
                            bold={category === cat}
                            color={category === cat ? 'cyan' : 'white'}
                            underline={category === cat}
                        >
                            {cat === 'Fortune' ? '運勢' : cat === 'Day' ? '曜日' : '天気'}
                        </Text>
                    </Box>
                ))}
            </Box>

            <BorderBox>
                <Box flexDirection="column" paddingX={1} minHeight={12}>
                    {renderContent()}
                </Box>
            </BorderBox>

            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>← →: カテゴリ切替  Enter/Esc: 戻る</Text>
            </Box>
        </Box>
    );
}
