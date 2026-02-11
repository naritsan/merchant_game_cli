import React from 'react';
import { Box } from 'ink';

type Props = {
    width?: number | string;
    height?: number;
    children: React.ReactNode;
    flexGrow?: number;
};

export default function BorderBox({ width, height, children, flexGrow }: Props) {
    return (
        <Box
            flexDirection="column"
            width={width}
            minHeight={height}
            borderStyle="single"
            paddingX={1}
            flexGrow={flexGrow}
        >
            {children}
        </Box>
    );
}
