
import { TransactionRecord } from '../types/index.js';
import { getItem } from '../types/items.js';

export type ItemAnalysis = {
    itemId: string;
    itemName: string;
    salesCount: number;
    totalSales: number;
    totalCost: number;
    averageSellPrice: number;
    purchaseCount: number;
    totalPurchases: number;
    averagePurchasePrice: number;
};

export type DailyAnalysis = {
    day: number;
    totalSales: number;
    totalPurchases: number;
    profit: number; // Cash flow based: Sales - Purchases
    transactionCount: number;
};

export function aggregateByItem(transactions: TransactionRecord[]): ItemAnalysis[] {
    const map = new Map<string, ItemAnalysis>();

    for (const t of transactions) {
        if (!map.has(t.itemId)) {
            const itemData = getItem(t.itemId);
            map.set(t.itemId, {
                itemId: t.itemId,
                itemName: itemData.name,
                salesCount: 0,
                totalSales: 0,
                totalCost: 0,
                averageSellPrice: 0,
                purchaseCount: 0,
                totalPurchases: 0,
                averagePurchasePrice: 0,
            });
        }

        const analysis = map.get(t.itemId)!;

        if (t.type === 'sell') {
            analysis.salesCount += t.quantity;
            analysis.totalSales += t.totalPrice;
            // Calculate cost for this sale if available
            if (t.cost !== undefined) {
                analysis.totalCost += t.cost * t.quantity;
            }
        } else if (t.type === 'buy') {
            analysis.purchaseCount += t.quantity;
            analysis.totalPurchases += t.totalPrice;
        }
    }

    // Calculate averages
    return Array.from(map.values()).map(a => ({
        ...a,
        averageSellPrice: a.salesCount > 0 ? Math.floor(a.totalSales / a.salesCount) : 0,
        averagePurchasePrice: a.purchaseCount > 0 ? Math.floor(a.totalPurchases / a.purchaseCount) : 0,
    })).sort((a, b) => b.totalSales - a.totalSales); // Sort by total sales descending
}

export function aggregateByDay(transactions: TransactionRecord[], currentDay: number): DailyAnalysis[] {
    const map = new Map<number, DailyAnalysis>();

    // Initialize map with 0 for all days up to current day (or just from first transaction day)
    // For simplicity, let's just use the days present in transactions + current day

    // Find min day
    const days = transactions.map(t => t.date.day);
    const minDay = days.length > 0 ? Math.min(...days) : 1;

    for (let d = minDay; d <= currentDay; d++) {
        map.set(d, {
            day: d,
            totalSales: 0,
            totalPurchases: 0,
            profit: 0,
            transactionCount: 0
        });
    }

    for (const t of transactions) {
        if (!map.has(t.date.day)) {
            map.set(t.date.day, {
                day: t.date.day,
                totalSales: 0,
                totalPurchases: 0,
                profit: 0,
                transactionCount: 0
            });
        }

        const analysis = map.get(t.date.day)!;
        analysis.transactionCount += 1;

        if (t.type === 'sell') {
            analysis.totalSales += t.totalPrice;
            // Operating Profit: Sales - Cost of Goods Sold
            if (t.cost !== undefined) {
                analysis.profit += (t.price - t.cost) * t.quantity;
            } else {
                // Fallback for old data: treat as 0 profit or full profit?
                // Plan said "treat as 0 profit".
                // If we treat as 0 profit, then profit is 0.
            }
        } else if (t.type === 'buy') {
            analysis.totalPurchases += t.totalPrice;
            // Buying inventory affects Cash Flow but not Operating Profit directly in this simple model
            // If we want "Cash Flow", we subtract purchases.
            // If we want "Profit", we don't subtract purchases (they are assets), we subtract Cost of Goods Sold when selling.
            // The user wanted "Profit".
        }
    }

    return Array.from(map.values()).sort((a, b) => a.day - b.day);
}
