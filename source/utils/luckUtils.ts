import { type Luck } from '../types/index.js';

/**
 * 運勢に基づく仕入れ価格の倍率を取得する
 * (プレイヤーが問屋から買うときの価格倍率)
 * 低いほど有利
 */
export function getPurchaseCostMultiplier(luck: Luck): number {
    switch (luck) {
        case 'Divine': return 0.33;     // 神の加護: 1/3 (67% OFF)
        case 'Miracle': return 0.50;    // 星の導き: 50% OFF
        case 'Blessing': return 0.70;   // 女神の祝福: 30% OFF
        case 'Fortune': return 0.85;    // 幸運: 15% OFF
        case 'Normal': return 1.0;      // 平穏: 標準
        case 'BadOmen': return 1.1;     // 不吉な予感: 10% 高騰
        case 'Curse': return 1.3;       // 呪い: 30% 高騰
        case 'Doom': return 1.6;        // 破滅の兆し: 60% 高騰
        case 'Apocalypse': return 2.5;  // 黙示録: 2.5倍
        default: return 1.0;
    }
}

/**
 * 運勢に基づく客の予算倍率を取得する
 * (プレイヤーが客に売るときの客の予算倍率)
 * 高いほど有利
 */
export function getCustomerBudgetMultiplier(luck: Luck): number {
    switch (luck) {
        case 'Divine': return 3.00;     // 神の加護: 3倍
        case 'Miracle': return 2.00;    // 星の導き: 2倍
        case 'Blessing': return 1.50;   // 女神の祝福: 1.5倍
        case 'Fortune': return 1.10;    // 幸運: 1.1倍
        case 'Normal': return 1.00;     // 平穏: 標準
        case 'BadOmen': return 0.90;    // 不吉な予感: 0.9倍
        case 'Curse': return 0.75;      // 呪い: 0.75倍
        case 'Doom': return 0.50;       // 破滅の兆し: 半減
        case 'Apocalypse': return 0.20; // 黙示録: 0.2倍 (激渋)
        default: return 1.0;
    }
}
