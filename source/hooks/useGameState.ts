import { useState, useCallback } from 'react';
import { type GameState, BATTLE_COMMANDS } from '../types/index.js';

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
};

export function useGameState() {
    const [state, setState] = useState<GameState>(initialState);

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
            const newDay = prev.day;

            while (newMinute >= 60) {
                newMinute -= 60;
                newHour += 1;
            }

            // 24時を超えた場合などの処理は必要に応じて追加
            // 今回は営業終了などの制御は各コンポーネントで行う想定

            return {
                ...prev,
                hour: newHour,
                minute: newMinute,
                day: newDay,
            };
        });
    }, []);

    const sleep = useCallback(() => {
        setState(prev => ({
            ...prev,
            day: prev.day + 1,
            hour: 6,
            minute: 0,
            messages: [...prev.messages, 'ぐっすり眠って 体力が回復した！'],
            party: prev.party.map(char => ({ ...char, hp: char.maxHp, mp: char.maxMp })),
        }));
    }, []);

    return { state, setState, moveCommand, selectCommand, addMessage, changeScene, advanceTime, sleep };
}
