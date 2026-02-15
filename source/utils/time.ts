
import { type DayOfWeek, DAYS_OF_WEEK } from '../types/index.js';

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

export interface GameDate {
    year: number;
    month: number;
    day: number;
    dayOfWeek: DayOfWeek;
    season: Season;
    totalDays: number;
}

// 4月1日スタートのためのオフセット (1月:31 + 2月:28 + 3月:31 = 90日)
export const GAME_START_DAY_OFFSET = 90;

export const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

export const getDaysInMonth = (year: number, month: number): number => {
    if (month === 2) {
        return isLeapYear(year) ? 29 : 28;
    }
    if ([4, 6, 9, 11].includes(month)) {
        return 30;
    }
    return 31;
};

export const getDaysInYear = (year: number): number => {
    return isLeapYear(year) ? 366 : 365;
};

export const getSeason = (month: number): Season => {
    if (month >= 3 && month <= 5) return 'Spring';
    if (month >= 6 && month <= 8) return 'Summer';
    if (month >= 9 && month <= 11) return 'Autumn';
    return 'Winter'; // 12, 1, 2
};

export const getSeasonLabel = (season: Season): string => {
    switch (season) {
        case 'Spring': return '春';
        case 'Summer': return '夏';
        case 'Autumn': return '秋';
        case 'Winter': return '冬';
    }
};

export const getSeasonColor = (season: Season): string => {
    switch (season) {
        case 'Spring': return '#FF66CC'; // ピンク
        case 'Summer': return '#FF8080'; // 薄い赤（珊瑚色）
        case 'Autumn': return '#FFCC66'; // 薄いオレンジ（杏色）
        case 'Winter': return 'white';   // 白
    }
};

export const getGameDate = (totalDays: number): GameDate => {
    let daysRemaining = totalDays - 1; // 0-indexed for calculation
    let year = 1;

    // Calculate Year
    while (true) {
        const daysInCurrentYear = getDaysInYear(year);
        if (daysRemaining < daysInCurrentYear) {
            break;
        }
        daysRemaining -= daysInCurrentYear;
        year++;
    }

    // Calculate Month
    let month = 1;
    while (true) {
        const daysInCurrentMonth = getDaysInMonth(year, month);
        if (daysRemaining < daysInCurrentMonth) {
            break;
        }
        daysRemaining -= daysInCurrentMonth;
        month++;
    }

    const day = daysRemaining + 1; // 1-indexed

    // Calculate DayOfWeek
    // Assuming Day 1 (Year 1, Month 1, Day 1) is Monday
    // If Day 1 is Monday, index 0.
    const dayOfWeekIndex = (totalDays - 1) % 7;
    const dayOfWeek = DAYS_OF_WEEK[dayOfWeekIndex] as DayOfWeek;

    const season = getSeason(month);

    return {
        year,
        month,
        day,
        dayOfWeek,
        season,
        totalDays,
    };
};
