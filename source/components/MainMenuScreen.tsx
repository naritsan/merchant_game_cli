import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import CommandMenu from './CommandMenu.js';
import { type GameState, LUCK_TYPES, WEATHER_TYPES, DAYS_OF_WEEK } from '../types/index.js';

type Props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    changeScene: (scene: GameState['scene']) => void;
    sleep: () => void;
    advanceTime: (minutes: number) => void;
};

type MenuMode = 'main' | 'submenu' | 'rest' | 'confirm' | 'debug_menu' | 'debug_date' | 'debug_time' | 'debug_luck' | 'debug_weather' | 'debug_gold';

const CATEGORIES = [
    { id: 'action', label: 'こうどう', commands: ['みせをひらく', 'しいれ', 'うらない'] },
    { id: 'system', label: 'システム', commands: ['もちもの', 'カレンダー', 'Tips'] },
    { id: 'debug', label: 'デバッグ', commands: ['日付変更', '時間変更', '運勢変更', '天気変更', '所持金変更', '客予算表示切替'] },
] as const;

const LUCK_LABELS: Record<string, string> = {
    'Divine': '神の加護', 'Miracle': '星の導き', 'Blessing': '女神の祝福', 'Fortune': '幸運',
    'Normal': '平穏', 'BadOmen': '不吉な予感', 'Curse': '呪い', 'Doom': '破滅の兆し', 'Apocalypse': '黙示録'
};

const WEATHER_LABELS: Record<string, string> = {
    'sunny': '快晴', 'rainy': '雨', 'snowy': '雪', 'storm': '嵐', 'aurora': 'オーロラ'
};

export default function MainMenuScreen({ state, setState, changeScene, sleep, advanceTime }: Props) {
    const { exit } = useApp();
    const [mode, setMode] = React.useState<MenuMode>('main');
    const [selectedMain, setSelectedMain] = React.useState(0);
    const [selectedSub, setSelectedSub] = React.useState(0);
    const [restSelected, setRestSelected] = React.useState(0);
    const [confirmSelected, setConfirmSelected] = React.useState(0);

    // Debug Menu States
    const [debugLuckSelected, setDebugLuckSelected] = React.useState(0);
    const [debugWeatherSelected, setDebugWeatherSelected] = React.useState(0);

    const [message, setMessage] = React.useState('');
    const [confirmAction, setConfirmAction] = React.useState<{
        message: string;
        onConfirm: () => void;
    } | null>(null);

    // 時間帯によるコマンド制御
    const isNight = state.hour >= 21;
    const isBeforeOpen = state.hour < 9;
    const isAfterClose = state.hour >= 18;

    const mainMenuItems = ['こうどう', 'システム', 'デバッグ', 'やすむ', 'おわる'];
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

    const confirmOptions = ['はい', 'いいえ'];

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
            case 'もちもの':
                changeScene('inventory');
                break;
            case '日付変更':
                setMode('debug_date');
                break;
            case '時間変更':
                setMode('debug_time');
                break;
            case '運勢変更':
                setMode('debug_luck');
                setDebugLuckSelected(LUCK_TYPES.indexOf(state.luck));
                break;
            case '天気変更':
                setMode('debug_weather');
                setDebugWeatherSelected(WEATHER_TYPES.indexOf(state.weather));
                break;
            case '所持金変更':
                setMode('debug_gold');
                break;
            case '客予算表示切替':
                setState(prev => ({ ...prev, showCustomerBudget: !prev.showCustomerBudget }));
                setMessage(`客の予算表示を ${!state.showCustomerBudget ? 'ON' : 'OFF'} にしました。`);
                break;
            case 'やすむ':
                setMode('rest');
                setRestSelected(0);
                break;
            case 'おわる':
                setConfirmAction({
                    message: 'ゲームを終了します。よろしいですか？',
                    onConfirm: () => exit()
                });
                setMode('confirm');
                setConfirmSelected(1); // デフォルトは「いいえ」
                break;
        }
    };

    const updateDate = (dayChange: number) => {
        setState(prev => {
            const newDay = Math.max(1, prev.day + dayChange);
            const dayDiff = newDay - prev.day;
            const currentDayIndex = DAYS_OF_WEEK.indexOf(prev.dayOfWeek);
            const newDayIndex = (currentDayIndex + dayDiff) % 7;
            const finalDayIndex = newDayIndex < 0 ? newDayIndex + 7 : newDayIndex;

            return {
                ...prev,
                day: newDay,
                dayOfWeek: DAYS_OF_WEEK[finalDayIndex]!
            };
        });
    };

    const updateTime = (minuteChange: number) => {
        setState(prev => {
            let newMinute = prev.minute + minuteChange;
            let newHour = prev.hour;

            while (newMinute >= 60) {
                newMinute -= 60;
                newHour += 1;
            }
            while (newMinute < 0) {
                newMinute += 60;
                newHour -= 1;
            }

            // 0時〜23時の範囲に収める（日付またぎは今回は考慮せずループさせる）
            if (newHour >= 24) {
                newHour = newHour % 24;
            } else if (newHour < 0) {
                newHour = (newHour % 24 + 24) % 24;
            }

            return {
                ...prev,
                hour: newHour,
                minute: newMinute,
            };
        });
    };

    const updateGold = (amount: number) => {
        setState(prev => ({
            ...prev,
            gold: Math.max(0, prev.gold + amount)
        }));
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
                if (item === 'こうどう') {
                    if (isNight) {
                        setMessage('もう 夜遅い。行動は控えよう。');
                        return;
                    }
                    setMode('submenu');
                    setSelectedSub(0);
                } else if (item === 'システム') {
                    setMode('submenu');
                    setSelectedSub(0);
                } else if (item === 'デバッグ') {
                    setMode('submenu');
                    setSelectedSub(0);
                } else if (item === 'やすむ') {
                    setMode('rest');
                    setRestSelected(0);
                } else if (item === 'おわる') {
                    handleCommand('おわる');
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
                    setConfirmAction({
                        message: '明日まで休みます。よろしいですか？',
                        onConfirm: () => {
                            sleep();
                            setMessage('翌日(06:00)まで 休んだ。');
                        }
                    });
                    setMode('confirm');
                    setConfirmSelected(0);
                } else if (option.minutes) {
                    advanceTime(option.minutes);
                    setMessage(`${option.label.replace('休む', '休んだ')}。`);
                    setMode('main');
                } else if (option.targetHour !== undefined) {
                    const currentTotalMinutes = state.hour * 60 + state.minute;
                    const targetTotalMinutes = option.targetHour * 60;
                    const diff = targetTotalMinutes - currentTotalMinutes;
                    if (diff > 0) {
                        advanceTime(diff);
                        setMessage(`${option.label.replace('休む', '休んだ')}。`);
                    }
                    setMode('main');
                }
            }
        } else if (mode === 'confirm') {
            if (key.leftArrow || key.upArrow) {
                setConfirmSelected(0);
            } else if (key.rightArrow || key.downArrow) {
                setConfirmSelected(1);
            } else if (key.escape) {
                setMode('main');
                setConfirmAction(null);
            } else if (key.return) {
                if (confirmSelected === 0) {
                    confirmAction?.onConfirm();
                }
                setMode('main');
                setConfirmAction(null);
            }
        } else if (mode === 'debug_date') {
            if (key.leftArrow) updateDate(-10);
            if (key.rightArrow) updateDate(10);
            if (key.downArrow) updateDate(-1);
            if (key.upArrow) updateDate(1);
            if (key.escape || key.return) setMode('submenu');
        } else if (mode === 'debug_time') {
            if (key.leftArrow) updateTime(-60); // 1時間
            if (key.rightArrow) updateTime(60); // 1時間
            if (key.downArrow) updateTime(-30);
            if (key.upArrow) updateTime(30);
            if (key.escape || key.return) setMode('submenu');
        } else if (mode === 'debug_luck') {
            if (key.upArrow) {
                setDebugLuckSelected(prev => (prev - 1 + LUCK_TYPES.length) % LUCK_TYPES.length);
            } else if (key.downArrow) {
                setDebugLuckSelected(prev => (prev + 1) % LUCK_TYPES.length);
            } else if (key.escape) {
                setMode('submenu');
            } else if (key.return) {
                setState(prev => ({ ...prev, luck: LUCK_TYPES[debugLuckSelected]!, isLuckRevealed: true }));
                setMode('submenu');
            }
        } else if (mode === 'debug_weather') {
            if (key.upArrow) {
                setDebugWeatherSelected(prev => (prev - 1 + WEATHER_TYPES.length) % WEATHER_TYPES.length);
            } else if (key.downArrow) {
                setDebugWeatherSelected(prev => (prev + 1) % WEATHER_TYPES.length);
            } else if (key.escape) {
                setMode('submenu');
            } else if (key.return) {
                setState(prev => ({ ...prev, weather: WEATHER_TYPES[debugWeatherSelected]! }));
                setMode('submenu');
            }
        } else if (mode === 'debug_gold') {
            if (key.leftArrow) updateGold(-1000);
            if (key.rightArrow) updateGold(1000);
            if (key.downArrow) updateGold(-100);
            if (key.upArrow) updateGold(100);
            if (key.escape || key.return) setMode('submenu');
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
                ) : mode === 'rest' ? (
                    <Box flexDirection="column">
                        <Text bold color="green">  どのくらい 休む？</Text>
                        {isNight && <Text color="blue">  もう夜が更けてきた…</Text>}
                        <CommandMenu
                            items={restOptions.map(o => o.label)}
                            selectedIndex={restSelected}
                        />
                    </Box>
                ) : mode === 'debug_date' ? (
                    <Box flexDirection="column" alignItems="center">
                        <Text bold color="yellow">【日付変更】</Text>
                        <Text>Day: {state.day} ({state.dayOfWeek})</Text>
                        <Text dimColor>← -10 / +10 →</Text>
                        <Text dimColor>↓ -1 / +1 ↑</Text>
                    </Box>
                ) : mode === 'debug_time' ? (
                    <Box flexDirection="column" alignItems="center">
                        <Text bold color="yellow">【時間変更】</Text>
                        <Text>{String(state.hour).padStart(2, '0')}:{String(state.minute).padStart(2, '0')}</Text>
                        <Text dimColor>← -1時間 / +1時間 →</Text>
                        <Text dimColor>↓ -30分 / +30分 ↑</Text>
                    </Box>
                ) : mode === 'debug_luck' ? (
                    <Box flexDirection="column">
                        <Text bold color="yellow">【運勢変更】</Text>
                        <CommandMenu
                            items={LUCK_TYPES.map(l => `${l} (${LUCK_LABELS[l]})`)}
                            selectedIndex={debugLuckSelected}
                        />
                    </Box>
                ) : mode === 'debug_weather' ? (
                    <Box flexDirection="column">
                        <Text bold color="yellow">【天気変更】</Text>
                        <CommandMenu
                            items={WEATHER_TYPES.map(w => `${w} (${WEATHER_LABELS[w]})`)}
                            selectedIndex={debugWeatherSelected}
                        />
                    </Box>
                ) : mode === 'debug_gold' ? (
                    <Box flexDirection="column" alignItems="center">
                        <Text bold color="yellow">【所持金変更】</Text>
                        <Text>所持金: {state.gold} G</Text>
                        <Text dimColor>← -1000 / +1000 →</Text>
                        <Text dimColor>↓ -100 / +100 ↑</Text>
                    </Box>
                ) : (
                    <Box flexDirection="column" paddingX={1}>
                        <Text bold color="yellow">  {confirmAction?.message}</Text>
                        <Box marginTop={1} justifyContent="center">
                            {confirmOptions.map((opt, i) => (
                                <Text key={opt}>
                                    {i === confirmSelected ? (
                                        <Text color="yellow" bold> ▶ {opt} </Text>
                                    ) : (
                                        <Text>   {opt} </Text>
                                    )}
                                    {i === 0 && '    '}
                                </Text>
                            ))}
                        </Box>
                    </Box>
                )}
            </BorderBox>

            {/* Help */}
            <Box justifyContent="center" marginTop={1}>
                {mode === 'confirm' ? (
                    <Text dimColor>←→: 選択  Enter: 決定  Esc: キャンセル</Text>
                ) : ['debug_date', 'debug_time', 'debug_gold'].includes(mode) ? (
                    <Text dimColor>矢印キー: 変更  Enter/Esc: 戻る</Text>
                ) : (
                    <Text dimColor>↑↓: 選択  Enter: 決定  {mode !== 'main' ? 'Esc: 戻る' : ''}</Text>
                )}
            </Box>
        </Box>
    );
}
