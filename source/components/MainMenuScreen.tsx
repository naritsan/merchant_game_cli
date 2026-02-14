import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import CommandMenu from './CommandMenu.js';
import { type GameState, MENU_COMMANDS } from '../types/index.js';

type Props = {
    state: GameState;
    changeScene: (scene: GameState['scene']) => void;
    sleep: () => void;
    advanceTime: (minutes: number) => void;
};

export default function MainMenuScreen({ state, changeScene, sleep, advanceTime }: Props) {
    const { exit } = useApp();
    const [selected, setSelected] = React.useState(0);
    const [message, setMessage] = React.useState('');
    const [mode, setMode] = React.useState<'menu' | 'rest'>('menu');
    const [restSelected, setRestSelected] = React.useState(0);

    // 時間帯によるコマンド制御
    const isNight = state.hour >= 21;
    const isBeforeOpen = state.hour < 9;
    const isAfterClose = state.hour >= 18;

    const availableCommands = isNight
        ? ['ねる', 'おわる']
        : MENU_COMMANDS.filter(cmd => cmd !== 'ねる');

    const restOptions = [
        { label: '30分 休む', minutes: 30 },
        { label: '1時間 休む', minutes: 60 },
        ...(state.hour < 9 ? [{ label: '開店(9:00)まで 休む', targetHour: 9 }] : []),
        ...(state.hour < 18 ? [{ label: '閉店(18:00)まで 休む', targetHour: 18 }] : []),
        { label: '明日(6:00)まで 休む', isSleep: true },
        { label: 'キャンセル', isCancel: true }
    ];

    useInput((_input, key) => {
        setMessage(''); // 入力があるたびにメッセージをクリア

        if (mode === 'menu') {
            if (key.upArrow) {
                setSelected(prev =>
                    (prev - 1 + availableCommands.length) % availableCommands.length,
                );
            } else if (key.downArrow) {
                setSelected(prev => (prev + 1) % availableCommands.length);
            } else if (key.return) {
                const command = availableCommands[selected]!;
                switch (command) {
                    case 'みせをひらく': {
                        if (isNight) {
                            setMessage('もう 夜遅い。 寝る時間だ。');
                            return;
                        }
                        if (state.dayOfWeek === 'Sunday') {
                            setMessage('今日は 安息日 だ。 店を開くことはできない。');
                            return;
                        }
                        if (isAfterClose) {
                            setMessage('本日の営業は終了しました。');
                            return;
                        }
                        changeScene('shop_setup');
                        break;
                    }

                    case 'しいれ': {
                        if (isNight) {
                            setMessage('もう 夜遅い。 寝る時間だ。');
                            return;
                        }
                        if (state.dayOfWeek === 'Sunday') {
                            setMessage('今日は 安息日 だ。 市場も休みだ。');
                            return;
                        }
                        if (isBeforeOpen) {
                            setMessage('まだ 店が開いていない時間だ。(9:00開店)');
                            return;
                        }
                        if (isAfterClose) {
                            setMessage('市場は もう閉まっている。(18:00閉店)');
                            return;
                        }
                        changeScene('shop');
                        break;
                    }

                    case 'うらない': {
                        if (isNight) {
                            setMessage('占い師も もう寝ている時間だ。');
                            return;
                        }
                        if (state.isLuckRevealed) {
                            setMessage('今日の運勢は もう占ってもらった。');
                            return;
                        }
                        if (state.gold < 1000) {
                            setMessage('お金が足りない！(1000G必要)');
                            return;
                        }
                        changeScene('fortune');
                        break;
                    }

                    case 'カレンダー': {
                        changeScene('calendar');
                        break;
                    }

                    case 'Tips': {
                        changeScene('tips');
                        break;
                    }

                    case 'たたかう': {
                        if (isNight) return;
                        changeScene('battle');
                        break;
                    }

                    case 'もちもの': {
                        if (isNight) return; // 夜はもちものも見れない仕様にするなら
                        changeScene('inventory');
                        break;
                    }

                    case 'やすむ': {
                        setMode('rest');
                        setRestSelected(0);
                        break;
                    }

                    case 'ねる': {
                        sleep();
                        setMessage('翌日になった！');
                        break;
                    }

                    case 'おわる': {
                        exit();
                        break;
                    }

                    // No default
                }
            }
        } else if (mode === 'rest') {
            if (key.upArrow) {
                setRestSelected(prev => (prev - 1 + restOptions.length) % restOptions.length);
            } else if (key.downArrow) {
                setRestSelected(prev => (prev + 1) % restOptions.length);
            } else if (key.escape) {
                setMode('menu');
            } else if (key.return) {
                const option = restOptions[restSelected]!;
                if (option.isCancel) {
                    setMode('menu');
                    return;
                }

                if (option.isSleep) {
                    sleep();
                    setMessage('翌日(06:00)まで 休んだ。');
                } else if (option.minutes) {
                    advanceTime(option.minutes);
                    setMessage(`${option.label.replace('休む', '休んだ')}。`);
                } else if (option.targetHour !== undefined) {
                    const currentTotalMinutes = state.hour * 60 + state.minute;
                    const targetTotalMinutes = option.targetHour * 60;
                    const diff = targetTotalMinutes - currentTotalMinutes;
                    if (diff > 0) {
                        advanceTime(diff);
                        setMessage(`${option.label.replace('休む', '休んだ')}。`);
                    }
                }
                setMode('menu');
            }
        }
    });

    return (
        <Box flexDirection="column" width={60}>
            {/* Message Area */}
            <Box height={1} justifyContent="center">
                {message ? <Text color="red">{message}</Text> : null}
            </Box>

            {/* Party Status Summary */}
            <BorderBox>
                <Box flexDirection="column" paddingX={1}>
                    <Text bold color="cyan">パーティ</Text>
                    <Text> </Text>
                    {state.party.map(char => (
                        <Text key={char.name}>
                            {'  '}{char.name}{'  '}
                            <Text color={char.hp / char.maxHp <= 0.25 ? 'red' : char.hp / char.maxHp <= 0.5 ? 'yellow' : 'white'}>
                                HP {char.hp}/{char.maxHp}
                            </Text>
                            {'  '}
                            <Text color="cyan">MP {char.mp}/{char.maxMp}</Text>
                        </Text>
                    ))}
                    <Text> </Text>
                    <Text>
                        {'  '}所持金: <Text color="yellow">{state.gold} G</Text>
                    </Text>
                </Box>
            </BorderBox>

            {/* Menu or Rest Menu */}
            <BorderBox>
                {mode === 'rest' ? (
                    <Box flexDirection="column">
                        <Text bold color="green">  どのくらい 休む？</Text>
                        <CommandMenu
                            items={restOptions.map(o => o.label)}
                            selectedIndex={restSelected}
                        />
                    </Box>
                ) : (
                    <CommandMenu
                        items={availableCommands}
                        selectedIndex={selected}
                    />
                )}
            </BorderBox>

            {/* Help */}
            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>↑↓: 選択  Enter: 決定  {mode === 'rest' ? 'Esc: キャンセル' : ''}</Text>
            </Box>
        </Box>
    );
}
