import { useState, useCallback } from 'react';
import { type GameState, BATTLE_COMMANDS } from '../types/index.js';

const initialState: GameState = {
    scene: 'menu',
    party: [
        { name: '商人', hp: 100, maxHp: 100, mp: 20, maxMp: 20, weapon: undefined, armor: undefined },
    ],
    monster: {
        name: 'ドラゴン',
        emoji: '🐉',
        hp: 80,
        maxHp: 100,
    },
    messages: [
        'ドラゴンが あらわれた！',
    ],
    selectedCommand: 0,
    shop: {
        gold: 1000,
        inventory: [],
        shopMessage: 'いらっしゃい！ なにを おもとめですか？',
        selectedMenuItem: 0,
        selectedItemIndex: 0,
        mode: 'menu',
    },
    sellShop: {
        customer: null,
        sellMessage: 'みせを ひらいた！',
        selectedCommand: 0,
        salesCount: 0,
        isWaiting: false,
    },
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

    return { state, setState, moveCommand, selectCommand, addMessage, changeScene };
}
