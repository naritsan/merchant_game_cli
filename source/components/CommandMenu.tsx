import React from 'react';
import { Box, Text } from 'ink';

type Props = {
    items: string[];
    selectedIndex: number;
};

export default function CommandMenu({ items, selectedIndex }: Props) {
    return (
        <Box flexDirection="column" paddingX={1}>
            {items.map((cmd, i) => (
                <Text key={cmd}>
                    {i === selectedIndex ? (
                        <Text color="yellow" bold>
                            ▶ {cmd}
                        </Text>
                    ) : (
                        <Text>{'  '}{cmd}</Text>
                    )}
                </Text>
            ))}
        </Box>
    );
}
