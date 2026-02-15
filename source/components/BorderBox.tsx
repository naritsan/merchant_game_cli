import React from 'react';
import { Box, Text } from 'ink';

type Props = {
    children: React.ReactNode;
    width?: number;
    height?: number;
    flexGrow?: number;
    flexDirection?: 'row' | 'column';
    alignItems?: 'flex-start' | 'center' | 'flex-end';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
    borderColor?: string;
    borderStyle?: 'single' | 'double' | 'round' | 'bold';
    paddingX?: number;
    paddingY?: number;
    minHeight?: number;
    title?: string;
};

export default function BorderBox({
    children,
    width,
    height,
    flexGrow,
    flexDirection = 'column',
    alignItems,
    justifyContent,
    borderColor = 'white',
    borderStyle = 'round',
    paddingX = 1,
    paddingY = 0,
    minHeight,
    title,
}: Props) {
    return (
        <Box
            width={width}
            height={height}
            flexGrow={flexGrow}
            borderStyle={borderStyle}
            borderColor={borderColor}
            flexDirection={flexDirection}
            alignItems={alignItems}
            justifyContent={justifyContent}
            paddingX={paddingX}
            paddingY={paddingY}
            minHeight={minHeight}
        >
            {title && (
                <Box position="absolute" marginTop={-1} marginLeft={1}>
                    <Box paddingX={1}>
                        <Text bold>{title}</Text>
                    </Box>
                </Box>
            )}
            {children}
        </Box>
    );
}
