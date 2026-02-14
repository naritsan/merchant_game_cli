import { useState, useCallback } from 'react';
import { type GameState, type Weather, type DayOfWeek, type Luck, BATTLE_COMMANDS, DAYS_OF_WEEK } from '../types/index.js';

const initialState: GameState = {
    scene: 'menu',
    party: [
        { name: '商人', hp: 100, maxHp: 100, mp: 20, maxMp: 20, weapon: undefined, armor: undefined },
    ],
    monster: {
        name: 'ドラゴン',
        hp: 80,
        maxHp: 100,
    },
    messages: [
        'ドラゴンが あらわれた！',
    ],
    selectedCommand: 0,
    gold: 3000,
    inventory: [],
    shop: {
        shopMessage: 'いらっしゃい！ なにを おもとめですか？',
        selectedMenuItem: 0,
        selectedItemIndex: 0,
        mode: 'menu',
    },
    sellShop: {
        displayItems: [],
        customer: null,
        sellMessage: '商品を 陳列して ください',
        selectedCommand: 0,
        salesCount: 0,
        phase: 'setup',
        isWaiting: false,
        currentSales: 0,
        currentProfit: 0,
    },
    day: 1,
    hour: 9,
    minute: 0,
    weather: 'sunny',
    dayOfWeek: 'Monday',
    luck: 'Normal', // 初期値はNormalにしておく（ランダムにするならuseGameState内で再設定）
    isLuckRevealed: false,
};

export function useGameState() {
    const [state, setState] = useState<GameState>(initialState);


    const determineWeather = (): Weather => {
        const rand = Math.random() * 100;
        if (rand < 80) return 'sunny';
        if (rand < 99) return 'rainy';
        if (rand < 99.5) return 'snowy';
        if (rand < 99.8) return 'storm';
        return 'aurora';
    };

    const determineLuck = (): Luck => {
        const lucks: Luck[] = ['Divine', 'Miracle', 'Blessing', 'Fortune', 'Normal', 'BadOmen', 'Curse', 'Doom', 'Apocalypse'];
        const rand = Math.floor(Math.random() * lucks.length);
        return lucks[rand]!;
    };

    const nextDayOfWeek = (current: DayOfWeek): DayOfWeek => {
        const currentIndex = DAYS_OF_WEEK.indexOf(current);
        return DAYS_OF_WEEK[(currentIndex + 1) % DAYS_OF_WEEK.length]!;
    };

    const updateDailyState = (prevState: GameState): Partial<GameState> => {
        return {
            day: prevState.day + 1,
            weather: determineWeather(),
            dayOfWeek: nextDayOfWeek(prevState.dayOfWeek),
            luck: determineLuck(),
            isLuckRevealed: false,
        };
    };

    const moveCommand = useCallback((direction: 'up' | 'down') => {
        setState(prev => {
            const next =
                direction === 'up'
                    ? (prev.selectedCommand - 1 + BATTLE_COMMANDS.length) % BATTLE_COMMANDS.length
                    : (prev.selectedCommand + 1) % BATTLE_COMMANDS.length;
            return { ...prev, selectedCommand: next };
        });
    }, []);

    const selectCommand = useCallback(() => {
        setState(prev => {
            const command = BATTLE_COMMANDS[prev.selectedCommand]!;
            const newMessage = `▶ ${command} を選んだ！`;
            return {
                ...prev,
                messages: [...prev.messages, newMessage],
            };
        });
    }, []);

    const addMessage = useCallback((message: string) => {
        setState(prev => ({
            ...prev,
            messages: [...prev.messages, message],
        }));
    }, []);

    const changeScene = useCallback((scene: GameState['scene']) => {
        setState(prev => ({ ...prev, scene }));
    }, []);

    const advanceTime = useCallback((minutes: number) => {
        setState(prev => {
            let newMinute = prev.minute + minutes;
            let newHour = prev.hour;
            let dayUpdate: Partial<GameState> = {};

            while (newMinute >= 60) {
                newMinute -= 60;
                newHour += 1;
            }

            while (newHour >= 24) {
                newHour -= 24;
                dayUpdate = updateDailyState(prev);
                // 日付が変わったら、prevの内容ではなく、今計算した新しい日付情報を使う必要あがるところだが、
                // updateDailyStateはday+1などを返すので、ここでは単にマージする。
                // ただしループする（48時間進むとか）場合はロジックが複雑になるが、今回のゲームでは短時間経過が主。
                // 念のため再帰的に呼び出すか、ループ対応するかだが、シンプルに1日またぎのみ対応とする。
            }

            return {
                ...prev,
                ...dayUpdate,
                hour: newHour,
                minute: newMinute,
            };
        });
    }, []);

    const sleep = useCallback(() => {
        setState(prev => ({
            ...prev,
            ...updateDailyState(prev),
            hour: 6,
            minute: 0,
            messages: [...prev.messages, 'ぐっすり眠って 体力が回復した！'],
            party: prev.party.map(char => ({ ...char, hp: char.maxHp, mp: char.maxMp })),
        }));
    }, []);

    const revealLuck = useCallback(() => {
        setState(prev => {
            let newMinute = prev.minute + 30;
            let newHour = prev.hour;
            let dayUpdate: Partial<GameState> = {};

            while (newMinute >= 60) {
                newMinute -= 60;
                newHour += 1;
            }

            while (newHour >= 24) {
                newHour -= 24;
                dayUpdate = updateDailyState(prev);
            }

            return {
                ...prev,
                ...dayUpdate,
                hour: newHour,
                minute: newMinute,
                gold: prev.gold - 1000,
                isLuckRevealed: true,
            };
        });
    }, []);

    return { state, setState, moveCommand, selectCommand, addMessage, changeScene, advanceTime, sleep, revealLuck };
}
