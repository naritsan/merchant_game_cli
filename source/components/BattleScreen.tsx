import React from 'react';
import { Box, Text, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import MonsterArea from './MonsterArea.js';
import MessageLog from './MessageLog.js';
import CommandMenu from './CommandMenu.js';
import StatusPanel from './StatusPanel.js';
import { type GameState, BATTLE_COMMANDS } from '../types/index.js';

type Props = {
    state: GameState;
    moveCommand: (direction: 'up' | 'down') => void;
    selectCommand: () => void;
    changeScene: (scene: GameState['scene']) => void;
};

export default function BattleScreen({
    state,
    moveCommand,
    selectCommand,
    changeScene,
}: Props) {
    useInput((_input, key) => {
        if (key.upArrow) {
            moveCommand('up');
        } else if (key.downArrow) {
            moveCommand('down');
        } else if (key.return) {
            selectCommand();
        } else if (key.escape) {
            changeScene('menu');
        }
    });

    return (
        <Box flexDirection="column" width={60}>
            <Box justifyContent="center">
                <Text bold color="yellow">
                    ⚔️ Merchant Game ⚔️
                </Text>
            </Box>

            <BorderBox>
                <MonsterArea monster={state.monster} />
            </BorderBox>

            <BorderBox>
                <MessageLog messages={state.messages} />
            </BorderBox>

            <Box>
                <BorderBox flexGrow={1}>
                    <CommandMenu
                        items={BATTLE_COMMANDS as unknown as string[]}
                        selectedIndex={state.selectedCommand}
                    />
                </BorderBox>
                <BorderBox flexGrow={1}>
                    <StatusPanel party={state.party} />
                </BorderBox>
            </Box>

            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>↑↓: 選択 Enter: 決定 Esc: もどる Ctrl+C: 終了</Text>
            </Box>
        </Box>
    );
}
