import { useState, useCallback } from 'react';
import { type GameState, type Weather, type Luck, BATTLE_COMMANDS } from '../types/index.js';
import { getGameDate, GAME_START_DAY_OFFSET } from '../utils/time.js';

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
    dayOfWeek: 'Monday', // 1年4月1日は月曜
    luck: 'Normal', // 初期値はNormal
    isLuckRevealed: false,
    showCustomerBudget: false,
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
        const rand = Math.random() * 100;

        // 累積確率で判定
        if (rand < 1) return 'Divine';        // 1%
        if (rand < 4) return 'Miracle';       // 3% (1+3)
        if (rand < 14) return 'Blessing';     // 10% (4+10)
        if (rand < 34) return 'Fortune';      // 20% (14+20)
        if (rand < 66) return 'Normal';       // 32% (34+32)
        if (rand < 86) return 'BadOmen';      // 20% (66+20)
        if (rand < 96) return 'Curse';        // 10% (86+10)
        if (rand < 99) return 'Doom';         // 3% (96+3)
        return 'Apocalypse';                  // 1% (99+1)
    };

    const updateDailyState = (prevState: GameState): Partial<GameState> => {
        const nextDay = prevState.day + 1;
        const dateInfo = getGameDate(nextDay + GAME_START_DAY_OFFSET);
        return {
            day: nextDay,
            weather: determineWeather(),
            dayOfWeek: dateInfo.dayOfWeek,
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
