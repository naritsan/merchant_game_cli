import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import BorderBox from './BorderBox.js';
import CommandMenu from './CommandMenu.js';
import { type GameState, MENU_COMMANDS } from '../types/index.js';

type Props = {
    state: GameState;
    changeScene: (scene: GameState['scene']) => void;
};

export default function MainMenuScreen({ state, changeScene }: Props) {
    const { exit } = useApp();
    const [selected, setSelected] = React.useState(0);

    useInput((_input, key) => {
        if (key.upArrow) {
            setSelected(prev =>
                (prev - 1 + MENU_COMMANDS.length) % MENU_COMMANDS.length,
            );
        } else if (key.downArrow) {
            setSelected(prev => (prev + 1) % MENU_COMMANDS.length);
        } else if (key.return) {
            const command = MENU_COMMANDS[selected]!;
            switch (command) {
                case 'みせをひらく': {
                    changeScene('shop_setup');
                    break;
                }

                case 'しいれ': {
                    changeScene('shop');
                    break;
                }

                case 'たたかう': {
                    changeScene('battle');
                    break;
                }

                case 'おわる': {
                    exit();
                    break;
                }

                // No default
            }
        }
    });

    return (
        <Box flexDirection="column" width={60}>
            {/* Title */}
            <Box justifyContent="center" marginY={1}>
                <Text bold color="yellow">
                    ⚔️  Merchant Game  ⚔️
                </Text>
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
                <CommandMenu
                    items={MENU_COMMANDS as unknown as string[]}
                    selectedIndex={selected}
                />
            </BorderBox>

            {/* Help */}
            <Box justifyContent="center" marginTop={1}>
                <Text dimColor>↑↓: 選択  Enter: 決定</Text>
            </Box>
        </Box>
    );
}
