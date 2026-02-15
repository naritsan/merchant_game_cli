import React from 'react';
import { Box } from 'ink';

type Props = {
    width?: number | string;
    height?: number;
    children: React.ReactNode;
    flexGrow?: number;
    flexDirection?: 'row' | 'column';
};

export default function BorderBox({ width, height, children, flexGrow, flexDirection = 'column' }: Props) {
    return (
        <Box
            flexDirection={flexDirection}
            width={width}
            height={height}
            borderStyle="single"
            paddingX={1}
            flexGrow={flexGrow}
        >
            {children}
        </Box>
    );
}
