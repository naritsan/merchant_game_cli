import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import { type GameState, type Luck } from '../types/index.js';

type Props = {
    state: GameState;
    changeScene: (scene: GameState['scene']) => void;
    revealLuck: () => void;
};

const STEPS = [
    { text: '占い師: 「ようこそ、迷える子羊よ...」', wait: 1500 },
    { text: '占い師: 「今日の運勢を知りたいのじゃな？」', wait: 1500 },
    { text: '占い師: 「では、星の声を聞いてみよう...」', wait: 2000 },
    { text: '占い師: 「ふむふむ...」', wait: 1500 },
    { text: '占い師: 「見えたぞ！！」', wait: 1000 },
];

export default function FortuneScreen({ state, changeScene, revealLuck }: Props) {
    const [step, setStep] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (step < STEPS.length) {
            const timer = setTimeout(() => {
                setStep(prev => prev + 1);
            }, STEPS[step]!.wait);
            return () => clearTimeout(timer);
        } else {
            if (!state.isLuckRevealed) {
                revealLuck();
            }
            setIsFinished(true);
        }
        return undefined;
    }, [step, state.isLuckRevealed, revealLuck]);

    useInput((_input, key) => {
        if (isFinished && (key.return || key.escape)) {
            changeScene('menu');
        }
    });

    const getLuckColor = (luck: Luck): string => {
        switch (luck) {
            case 'Divine':
            case 'Miracle': return 'yellow';
            case 'Blessing':
            case 'Fortune': return 'green';
            case 'Normal': return 'white';
            case 'BadOmen':
            case 'Curse': return 'magenta';
            case 'Doom':
            case 'Apocalypse': return 'red';
            default: return 'white';
        }
    };

    const getLuckLabel = (luck: Luck): string => {
        switch (luck) {
            case 'Divine': return '神の加護';
            case 'Miracle': return '星の導き';
            case 'Blessing': return '女神の祝福';
            case 'Fortune': return '幸運';
            case 'Normal': return '平穏';
            case 'BadOmen': return '不吉な予感';
            case 'Curse': return '呪い';
            case 'Doom': return '破滅の兆し';
            case 'Apocalypse': return '黙示録';
            default: return '?';
        }
    }


    return (
        <Box flexDirection="column" width={60}>
            <BorderBox>
                <Box flexDirection="column" paddingX={1} minHeight={5}>
                    <Text bold color="magenta">=== 占い小屋 ===</Text>
                    <Text> </Text>
                    {step < STEPS.length ? (
                        <Text>{STEPS[step]?.text}</Text>
                    ) : (
                        <Box flexDirection="column">
                            <Text>占い師: 「今日のそなたの運勢は...」</Text>
                            <Text> </Text>
                            <Box justifyContent="center">
                                <Text bold underline color={getLuckColor(state.luck)}>
                                    {getLuckLabel(state.luck)}
                                </Text>
                            </Box>
                            <Text> </Text>
                            <Text>占い師: 「...という結果が出たようじゃ。」</Text>
                        </Box>
                    )}
                </Box>
            </BorderBox>
            {isFinished && (
                <Box justifyContent="center" marginTop={1}>
                    <Text dimColor>Enter: 戻る</Text>
                </Box>
            )}
        </Box>
    );
}
