export * from './items.js';
import { ItemId, ItemData } from './items.js';

// === アイテム ===
// Legacy Item type alias for compatibility during refactor, or we can just use ItemData
export type Item = ItemData;

// === 在庫アイテム (Legacy - to be removed/refactored) ===
// Keeping for a moment if needed, but we are switching to StackableItem
export type InventoryItem = {
	item: Item;
	purchasePrice: number;
};

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

export const CUSTOMERS: Omit<Customer, 'wantItem' | 'maxBudget' | 'targetPrice' | 'currentNegotiation' | 'dialogue'>[] = [
	{ name: 'まちのむすめ', maxNegotiations: 0 },
	{ name: 'たびのせんし', maxNegotiations: 2 },
	{ name: 'おかねもち', maxNegotiations: 3 },
	{ name: 'まほうつかい', maxNegotiations: 2 },
	{ name: 'ぼうけんしゃ', maxNegotiations: 0 },
	{ name: 'おじいさん', maxNegotiations: 3 },
	{ name: 'こどもの王子', maxNegotiations: 2 },
];

// === 戦闘 ===

export type BattleCommand = 'たたかう' | 'まほう' | 'どうぐ' | 'にげる';

export const BATTLE_COMMANDS: BattleCommand[] = [
	'たたかう',
	'まほう',
	'どうぐ',
	'にげる',
];

// === 仕入れショップ ===

export type ShopCommand = 'かう' | 'うる' | 'そうび' | 'やめる';

export const SHOP_COMMANDS: ShopCommand[] = [
	'かう',
	'そうび',
	'やめる',
];

// SHOP_ITEMS removed, utilize getAllItems() or filtered list from items.ts

// === 販売シーン ===

export type SellShopCommand = 'うる' | 'ねびき' | 'ことわる' | 'みせをとじる';

export const SELL_SHOP_COMMANDS: SellShopCommand[] = [
	'うる',
	'ねびき',
	'ことわる',
	'みせをとじる',
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
	currentSales: number;
	currentProfit: number;
};

// === 画面遷移 ===

export type Scene = 'menu' | 'battle' | 'shop' | 'shop_setup' | 'sell_shop' | 'inventory' | 'calendar' | 'fortune' | 'tips' | 'ledger' | 'stock_list';

export type MenuCommand = 'しいれ' | 'みせをひらく' | 'うらない' | 'ちょうぼ' | 'カレンダー' | 'もちもの' | 'Tips' | 'やすむ' | 'おわる';

export const MENU_COMMANDS: MenuCommand[] = [
	'みせをひらく',
	'しいれ',
	'うらない',
	'ちょうぼ',
	'カレンダー',
	'もちもの',
	'Tips',
	'やすむ',
	'おわる',
];

// === ショップ画面の状態 ===

export type ShopMode = 'menu' | 'buy' | 'sell';

export type ShopState = {
	shopMessage: string;
	selectedMenuItem: number;
	selectedItemIndex: number;
	mode: ShopMode;
};

// === ゲーム全体の状態 ===

export type GameState = {
	scene: Scene;
	party: Character[];
	monster: Monster;
	messages: string[];
	selectedCommand: number;
	gold: number;
	// inventory: InventoryItem[]; // Removed
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

