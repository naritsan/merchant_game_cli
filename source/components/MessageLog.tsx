import React from 'react';
import { Box, Text } from 'ink';

type Props = {
    messages: string[];
    maxLines?: number;
};

export default function MessageLog({ messages, maxLines = 4 }: Props) {
    const visibleMessages = messages.slice(-maxLines);

    return (
        <Box flexDirection="column" paddingX={1} minHeight={maxLines}>
            {visibleMessages.map((msg, i) => (
                <Text key={`${msg}-${i}`}>{msg}</Text>
            ))}
            {/* Fill empty lines */}
            {Array.from({ length: maxLines - visibleMessages.length }).map((_, i) => (
                <Text key={`empty-${i}`}> </Text>
            ))}
        </Box>
    );
}
