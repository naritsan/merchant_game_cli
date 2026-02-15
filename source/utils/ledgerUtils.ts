
import { TransactionRecord } from '../types/index.js';
import { getItem } from '../types/items.js';

export type ItemAnalysis = {
    itemId: string;
    itemName: string;
    salesCount: number;
    totalSales: number;
    totalCost: number; // For now, we might not track exact cost per transaction perfectly, but we can estimate or retrieve if available. 
    // In TransactionRecord, we only have 'price' (sell price) or 'price' (buy price) depending on type.
    // For profit analysis, we need to know the cost basis of sold items.
    // The current TransactionRecord for 'sell' doesn't explicitly store the original cost of the specific item sold.
    // However, we can approximate profit if we assume average purchase price at the time of sale, 
    // BUT 'TransactionRecord' for 'sell' currently only stores: id, date, type='sell', itemId, quantity, price(sold price), totalPrice, partner.
    // It does NOT store the original cost. 
    // To calculate profit accurately, we would need to store 'cost' in TransactionRecord or look up historical average.
    // For this version, let's assume we can't perfectly retroactively calculate profit for past transactions if cost wasn't recorded.
    // WAIT, `SellShopScreen`'s `executeSale` calculates profit but doesn't store it in TransactionRecord!
    // We should probably update TransactionRecord to include 'profit' or 'cost' for sell transactions in the future.
    // For now, let's focus on Sales and pure aggregation. 
    // If we want profit, we might need to modify TransactionRecord in a future refactor or just show "Revenue" for now.
    // ACTUALLY, let's keep it simple: Sales Revenue and Purchase Cost.
    // Profit = Total Sales - Total Purchases (Simple Cash Flow profit)
    // OR Profit per item = (Avg Sell Price - Avg Buy Price) * Sold Quantity (Approximation)

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
        } else if (t.type === 'buy') {
            analysis.totalPurchases += t.totalPrice;
        }
    }

    // Calculate profit (Cash flow)
    for (const analysis of map.values()) {
        analysis.profit = analysis.totalSales - analysis.totalPurchases;
    }

    return Array.from(map.values()).sort((a, b) => a.day - b.day);
}
