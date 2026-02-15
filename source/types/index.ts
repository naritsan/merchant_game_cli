export * from './items.js';
import { ItemId, ItemData } from './items.js';

// === アイテム ===
// Legacy Item type alias for compatibility during refactor, or we can just use ItemData
export type Item = ItemData;

// === 新しいインベントリシステム ===

export type StackableItem = {
	itemId: ItemId;
	quantity: number;
};

export type StockItem = StackableItem & {
	averagePurchasePrice: number;
};

export type TransactionType = 'buy' | 'sell';

export type TransactionRecord = {
	id: string;
	date: { day: number, hour: number, minute: number };
	type: TransactionType;
	itemId: ItemId;
	quantity: number;
	price: number;
	totalPrice: number;
	cost?: number; // 原価 (仕入れ時の平均単価)
	partner: string;
};

// === 陳列商品 ===

export type DisplayItem = {
	stockItem: StockItem; // Changed from InventoryItem
	originalCost: number; // Cost basis for this specific display item (usually avg price)
	price: number; // 値札
};

// === キャラクター ===

export type Job = 'Warrior' | 'Mage' | 'Thief' | 'Cleric'; // Assuming Job type is needed for the new Character definition

export type Character = {
	name: string;
	job: Job;
	level: number;
	exp: number;
	nextExp: number;
	hp: number;
	maxHp: number;
	mp: number;
	maxMp: number;
	str: number;
	vit: number;
	int: number;
	men: number;
	agi: number;
	dex: number;
	luck: number;
	weapon?: ItemId;
	armor?: ItemId;
};

// === モンスター ===

export type Monster = {
	name: string;
	hp: number;
	maxHp: number;
	dropItem?: ItemId;
	dropRate?: number;
};

// === 買い物客 ===

export type Customer = {
	name: string;
	wantItem: ItemId; // Changed to ItemId
	maxBudget: number;
	targetPrice: number;
	maxNegotiations: number;
	currentNegotiation: number;
	offeredPrice?: number;
	dialogue: string;
};

export const CUSTOMERS: (Omit<Customer, 'wantItem' | 'maxBudget' | 'targetPrice' | 'currentNegotiation' | 'dialogue'> & { preferredItems: ItemId[] })[] = [
	{ name: 'まちのむすめ', maxNegotiations: 0, preferredItems: ['herb', 'cloth_clothes'] },
	{ name: 'たびのせんし', maxNegotiations: 2, preferredItems: ['copper_sword', 'iron_sword', 'leather_shield', 'iron_shield'] },
	{ name: 'おかねもち', maxNegotiations: 3, preferredItems: ['steel_sword', 'chain_mail', 'iron_shield'] },
	{ name: 'まほうつかい', maxNegotiations: 2, preferredItems: ['herb', 'cloth_clothes'] },
	{ name: 'ぼうけんしゃ', maxNegotiations: 0, preferredItems: ['iron_sword', 'leather_shield', 'herb'] },
	{ name: 'おじいさん', maxNegotiations: 3, preferredItems: ['herb', 'cloth_clothes'] },
	{ name: 'こどもの王子', maxNegotiations: 2, preferredItems: ['copper_sword', 'leather_shield'] },
];

// === 戦闘 ===

// === 戦闘 ===

export type BattleCommand = '戦う' | '魔法' | '道具' | '逃げる';

export const BATTLE_COMMANDS: BattleCommand[] = [
	'戦う',
	'魔法',
	'道具',
	'逃げる',
];

// === 仕入れショップ ===

export type ShopCommand = '買う' | '装備' | '戻る';

export const SHOP_COMMANDS: ShopCommand[] = [
	'買う',
	'装備',
	'戻る',
];

// SHOP_ITEMS removed, utilize getAllItems() or filtered list from items.ts

// === 販売シーン ===

export type SellShopCommand = '売る' | '値引き' | '断る' | '店を閉じる';

export const SELL_SHOP_COMMANDS: SellShopCommand[] = [
	'売る',
	'値引き',
	'断る',
	'店を閉じる',
];

export type SellShopPhase = 'setup' | 'selling' | 'negotiating' | 'counter_offer';

export type SellShopState = {
	displayItems: DisplayItem[];
	customer: Customer | null;
	sellMessage: string;
	selectedCommand: number;
	salesCount: number;
	phase: SellShopPhase;
	negotiationResult?: 'success' | 'failed' | 'gave_up';
	counterOfferPrice?: number;
	isWaiting: boolean;
	currentSales: number; // Added tracking
	currentProfit: number; // Added tracking
};

// === 画面遷移 ===

export type Scene = 'menu' | 'battle' | 'shop' | 'shop_setup' | 'sell_shop' | 'inventory' | 'calendar' | 'fortune' | 'tips' | 'ledger' | 'stock_list';

export type MenuCommand = '仕入れ' | '開店' | '占い' | '帳簿' | 'カレンダー' | '持ち物' | 'Tips' | '休む' | '終わる';

export const MENU_COMMANDS: MenuCommand[] = [
	'開店',
	'仕入れ',
	'占い',
	'帳簿',
	'カレンダー',
	'持ち物',
	'Tips',
	'休む',
	'終わる',
];

// === ショップ画面の状態 ===

export type ShopMode = 'menu' | 'buy' | 'sell' | 'buy_quantity';

export type ShopState = {
	shopMessage: string;
	selectedMenuItem: number;
	selectedItemIndex: number;
	mode: ShopMode;
	sellTab: 'possessions' | 'stock';
};

// === ゲーム全体の状態 ===

export type GameState = {
	scene: Scene;
	party: Character[];
	monster: Monster;
	messages: string[];
	selectedCommand: number;
	gold: number;
	possessions: StackableItem[];
	stock: StockItem[];
	transactions: TransactionRecord[];
	shop: ShopState;
	sellShop: SellShopState;
	day: number;
	hour: number;
	minute: number;
	weather: Weather;
	dayOfWeek: DayOfWeek;
	luck: Luck;
	isLuckRevealed: boolean;
	showCustomerBudget: boolean; // デバッグ用：客の予算を表示するか
	menuMode: 'main' | 'submenu';
	selectedMain: number;
	selectedSub: number;
};

// === 天気 ===
export type Weather = 'sunny' | 'rainy' | 'snowy' | 'storm' | 'aurora';

export const WEATHER_TYPES: Weather[] = ['sunny', 'rainy', 'snowy', 'storm', 'aurora'];

// === 曜日 ===
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// === 季節 ===
export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

// === 運勢 ===
export type Luck = 'Divine' | 'Miracle' | 'Blessing' | 'Fortune' | 'Normal' | 'BadOmen' | 'Curse' | 'Doom' | 'Apocalypse';

export const LUCK_TYPES: Luck[] = ['Divine', 'Miracle', 'Blessing', 'Fortune', 'Normal', 'BadOmen', 'Curse', 'Doom', 'Apocalypse'];

