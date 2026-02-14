import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import CommandMenu from './CommandMenu.js';
import { type GameState } from '../types/index.js';

type Props = {
    state: GameState;
    changeScene: (scene: GameState['scene']) => void;
    sleep: () => void;
    advanceTime: (minutes: number) => void;
};

type MenuMode = 'main' | 'submenu' | 'rest';

const CATEGORIES = [
    { id: 'action', label: 'こうどう', commands: ['みせをひらく', 'しいれ', 'たたかう', 'うらない'] },
    { id: 'system', label: 'システム', commands: ['もちもの', 'カレンダー', 'Tips'] },
] as const;

export default function MainMenuScreen({ state, changeScene, sleep, advanceTime }: Props) {
    const { exit } = useApp();
    const [mode, setMode] = React.useState<MenuMode>('main');
    const [selectedMain, setSelectedMain] = React.useState(0);
    const [selectedSub, setSelectedSub] = React.useState(0);
    const [restSelected, setRestSelected] = React.useState(0);
    const [message, setMessage] = React.useState('');

    // 時間帯によるコマンド制御
    const isNight = state.hour >= 21;
    const isBeforeOpen = state.hour < 9;
    const isAfterClose = state.hour >= 18;

    const mainMenuItems = ['こうどう', 'システム', 'やすむ', 'おわる'];
    const currentCategory = selectedMain < CATEGORIES.length ? CATEGORIES[selectedMain] : null;
    const submenuItems = currentCategory ? [...currentCategory.commands, 'もどる'] : [];

    const restOptions = isNight ? [
        { label: '明日(6:00)まで 休む', isSleep: true },
        { label: 'キャンセル', isCancel: true }
    ] : [
        { label: '30分 休む', minutes: 30 },
        { label: '1時間 休む', minutes: 60 },
        ...(state.hour < 9 ? [{ label: '開店(9:00)まで 休む', targetHour: 9 }] : []),
        ...(state.hour < 18 ? [{ label: '閉店(18:00)まで 休む', targetHour: 18 }] : []),
        { label: '明日(6:00)まで 休む', isSleep: true },
        { label: 'キャンセル', isCancel: true }
    ];

    const handleCommand = (command: string) => {
        switch (command) {
            case 'みせをひらく': {
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
            case 'カレンダー':
                changeScene('calendar');
                break;
            case 'Tips':
                changeScene('tips');
                break;
            case 'たたかう':
                changeScene('battle');
                break;
            case 'もちもの':
                changeScene('inventory');
                break;
            case 'やすむ':
                setMode('rest');
                setRestSelected(0);
                break;
            case 'おわる':
                exit();
                break;
        }
    };

    useInput((_input, key) => {
        setMessage('');

        if (mode === 'main') {
            if (key.upArrow) {
                setSelectedMain(prev => (prev - 1 + mainMenuItems.length) % mainMenuItems.length);
            } else if (key.downArrow) {
                setSelectedMain(prev => (prev + 1) % mainMenuItems.length);
            } else if (key.return) {
                const item = mainMenuItems[selectedMain];
                if (item === 'こうどう' || item === 'システム') {
                    setMode('submenu');
                    setSelectedSub(0);
                } else if (item === 'やすむ') {
                    setMode('rest');
                    setRestSelected(0);
                } else if (item === 'おわる') {
                    exit();
                }
            }
        } else if (mode === 'submenu') {
            if (key.upArrow) {
                setSelectedSub(prev => (prev - 1 + submenuItems.length) % submenuItems.length);
            } else if (key.downArrow) {
                setSelectedSub(prev => (prev + 1) % submenuItems.length);
            } else if (key.escape) {
                setMode('main');
            } else if (key.return) {
                const item = submenuItems[selectedSub]!;
                if (item === 'もどる') {
                    setMode('main');
                } else {
                    handleCommand(item);
                }
            }
        } else if (mode === 'rest') {
            if (key.upArrow) {
                setRestSelected(prev => (prev - 1 + restOptions.length) % restOptions.length);
            } else if (key.downArrow) {
                setRestSelected(prev => (prev + 1) % restOptions.length);
            } else if (key.escape) {
                setMode('main');
            } else if (key.return) {
                const option = restOptions[restSelected]!;
                if (option.isCancel) {
                    setMode('main');
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
                setMode('main');
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

            {/* Menu */}
            <BorderBox>
                {mode === 'main' ? (
                    <Box flexDirection="column">
                        <Text bold color="green">  【メインメニュー】</Text>
                        <CommandMenu
                            items={mainMenuItems}
                            selectedIndex={selectedMain}
                        />
                    </Box>
                ) : mode === 'submenu' ? (
                    <Box flexDirection="column">
                        <Text bold color="green">  【{currentCategory?.label}】</Text>
                        <CommandMenu
                            items={submenuItems}
                            selectedIndex={selectedSub}
                        />
                    </Box>
                ) : (
                    <Box flexDirection="column">
                        <Text bold color="green">  どのくらい 休む？</Text>
                        {isNight && <Text color="blue">  もう夜が更けてきた…</Text>}
                        <CommandMenu
                            items={restOptions.map(o => o.label)}
                            selectedIndex={restSelected}
                        />
                    </Box>
                )}
            </BorderBox>

            {/* Help */}
            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>↑↓: 選択  Enter: 決定  {mode !== 'main' ? 'Esc: 戻る' : ''}</Text>
            </Box>
        </Box>
    );
}
