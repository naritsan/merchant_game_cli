import { useState, useCallback, useRef } from 'react';

/**
 * 連続して呼び出されると変化量が増加速する数値管理フック
 * @param initialValue 初期値
 * @param min 最小値
 * @param max 最大値
 */
export function useAcceleratedValue(initialValue: number, min: number = 0, max: number = Infinity) {
    const [value, setValue] = useState(initialValue);
    const lastChangeTime = useRef<number>(0);
    const consecutiveCount = useRef<number>(0);

    const change = useCallback((amount: number, overrideMin?: number, overrideMax?: number) => {
        const now = Date.now();
        // 200ms以内の連打なら連続とみなす
        if (now - lastChangeTime.current < 200) {
            consecutiveCount.current += 1;
        } else {
            consecutiveCount.current = 0;
        }
        lastChangeTime.current = now;

        // 加速ロジック: 
        // 0-4回: x1
        // 5-9回: x10
        // 10回以降: x100
        let multiplier = 1;
        if (consecutiveCount.current >= 10) {
            multiplier = 100;
        } else if (consecutiveCount.current >= 5) {
            multiplier = 10;
        }

        const step = amount * multiplier;
        const actualMin = overrideMin !== undefined ? overrideMin : min;
        const actualMax = overrideMax !== undefined ? overrideMax : max;

        setValue(prev => {
            const next = prev + step;
            if (next < actualMin) return actualMin;
            if (next > actualMax) return actualMax;
            return next;
        });
    }, [min, max]);

    return { value, setValue, change };
}
