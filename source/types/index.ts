// === アイテム ===

export type ItemType = 'weapon' | 'armor' | 'item';

export type Item = {
	name: string;
	price: number;
	type: ItemType;
	attack?: number;
	defense?: number;
};

// === 在庫アイテム ===

export type InventoryItem = {
	item: Item;
	purchasePrice: number; // 実際に仕入れた価格
};

// === 陳列商品 ===

export type DisplayItem = {
	inventoryItem: InventoryItem;
	price: number; // 値札（商人が設定）
};

// === キャラクター ===

export type Character = {
	name: string;
	hp: number;
	maxHp: number;
	mp: number;
	maxMp: number;
	weapon?: Item;
	armor?: Item;
};

// === モンスター ===

export type Monster = {
	name: string;
	hp: number;
	maxHp: number;
};

// === 買い物客 ===

export type Customer = {
	name: string;
	wantItem: Item;
	maxBudget: number; // 出せる最高額
	targetPrice: number; // その時の値札価格
	maxNegotiations: number; // 交渉可能回数（1～3）
	currentNegotiation: number; // 現在の交渉回数
	offeredPrice?: number; // 客が提示した価格
	dialogue: string;
};

export const CUSTOMERS: Customer[] = [
	{ name: 'まちのむすめ', wantItem: {} as Item, maxBudget: 0, targetPrice: 0, maxNegotiations: 0, currentNegotiation: 0, dialogue: '' },
	{ name: 'たびのせんし', wantItem: {} as Item, maxBudget: 0, targetPrice: 0, maxNegotiations: 2, currentNegotiation: 0, dialogue: '' },
	{ name: 'おかねもち', wantItem: {} as Item, maxBudget: 0, targetPrice: 0, maxNegotiations: 3, currentNegotiation: 0, dialogue: '' },
	{ name: 'まほうつかい', wantItem: {} as Item, maxBudget: 0, targetPrice: 0, maxNegotiations: 2, currentNegotiation: 0, dialogue: '' },
	{ name: 'ぼうけんしゃ', wantItem: {} as Item, maxBudget: 0, targetPrice: 0, maxNegotiations: 0, currentNegotiation: 0, dialogue: '' },
	{ name: 'おじいさん', wantItem: {} as Item, maxBudget: 0, targetPrice: 0, maxNegotiations: 3, currentNegotiation: 0, dialogue: '' },
	{ name: 'こどもの王子', wantItem: {} as Item, maxBudget: 0, targetPrice: 0, maxNegotiations: 2, currentNegotiation: 0, dialogue: '' },
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

export const SHOP_ITEMS: Item[] = [
	{ name: 'どうのつるぎ', price: 100, type: 'weapon', attack: 5 },
	{ name: 'てつのつるぎ', price: 500, type: 'weapon', attack: 15 },
	{ name: 'はがねのつるぎ', price: 1500, type: 'weapon', attack: 30 },
	{ name: 'かわのたて', price: 80, type: 'armor', defense: 3 },
	{ name: 'てつのたて', price: 300, type: 'armor', defense: 10 },
	{ name: 'ぬののふく', price: 50, type: 'armor', defense: 2 },
	{ name: 'くさりかたびら', price: 800, type: 'armor', defense: 18 },
];

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

export type Scene = 'menu' | 'battle' | 'shop' | 'shop_setup' | 'sell_shop' | 'inventory' | 'calendar' | 'fortune';

export type MenuCommand = 'たたかう' | 'しいれ' | 'みせをひらく' | 'うらない' | 'カレンダー' | 'もちもの' | 'やすむ' | 'ねる' | 'おわる';

export const MENU_COMMANDS: MenuCommand[] = [
	'みせをひらく',
	'しいれ',
	'うらない',
	'カレンダー',
	'もちもの',
	'やすむ',
	'ねる',
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
	inventory: InventoryItem[];
	shop: ShopState;
	sellShop: SellShopState;
	day: number;
	hour: number;
	minute: number;
	weather: Weather;
	dayOfWeek: DayOfWeek;
	luck: Luck;
	isLuckRevealed: boolean;
};

// === 天気 ===
export type Weather = 'sunny' | 'rainy' | 'snowy' | 'storm' | 'aurora';

// === 曜日 ===
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// === 運勢 ===
export type Luck = 'Divine' | 'Miracle' | 'Blessing' | 'Fortune' | 'Normal' | 'BadOmen' | 'Curse' | 'Doom' | 'Apocalypse';

