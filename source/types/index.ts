// === アイテム ===

export type ItemType = 'weapon' | 'armor' | 'item';

export type Item = {
	name: string;
	emoji: string;
	price: number;
	type: ItemType;
	attack?: number;
	defense?: number;
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
	emoji: string;
	hp: number;
	maxHp: number;
};

// === 買い物客 ===

export type Customer = {
	name: string;
	emoji: string;
	wantItem: Item;
	budget: number;
	dialogue: string;
};

export const CUSTOMERS: Customer[] = [
	{ name: 'まちのむすめ', emoji: '👩', wantItem: {} as Item, budget: 0, dialogue: '' },
	{ name: 'たびのせんし', emoji: '⚔️', wantItem: {} as Item, budget: 0, dialogue: '' },
	{ name: 'おかねもち', emoji: '🤵', wantItem: {} as Item, budget: 0, dialogue: '' },
	{ name: 'まほうつかい', emoji: '🧙', wantItem: {} as Item, budget: 0, dialogue: '' },
	{ name: 'ぼうけんしゃ', emoji: '🗡️', wantItem: {} as Item, budget: 0, dialogue: '' },
	{ name: 'おじいさん', emoji: '👴', wantItem: {} as Item, budget: 0, dialogue: '' },
	{ name: 'こどもの王子', emoji: '👑', wantItem: {} as Item, budget: 0, dialogue: '' },
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
	'うる',
	'そうび',
	'やめる',
];

export const SHOP_ITEMS: Item[] = [
	{ name: 'どうのつるぎ', emoji: '🗡️', price: 100, type: 'weapon', attack: 5 },
	{ name: 'てつのつるぎ', emoji: '🗡️', price: 500, type: 'weapon', attack: 15 },
	{ name: 'はがねのつるぎ', emoji: '⚔️', price: 1500, type: 'weapon', attack: 30 },
	{ name: 'かわのたて', emoji: '🛡️', price: 80, type: 'armor', defense: 3 },
	{ name: 'てつのたて', emoji: '🛡️', price: 300, type: 'armor', defense: 10 },
	{ name: 'ぬののふく', emoji: '👕', price: 50, type: 'armor', defense: 2 },
	{ name: 'くさりかたびら', emoji: '👕', price: 800, type: 'armor', defense: 18 },
];

// === 販売シーン ===

export type SellShopCommand = 'うる' | 'ねびき' | 'ことわる' | 'みせをとじる';

export const SELL_SHOP_COMMANDS: SellShopCommand[] = [
	'うる',
	'ねびき',
	'ことわる',
	'みせをとじる',
];

export type SellShopState = {
	customer: Customer | null;
	sellMessage: string;
	selectedCommand: number;
	salesCount: number;
	isWaiting: boolean;
};

// === 画面遷移 ===

export type Scene = 'menu' | 'battle' | 'shop' | 'sell_shop';

export type MenuCommand = 'たたかう' | 'しいれ' | 'みせをひらく' | 'おわる';

export const MENU_COMMANDS: MenuCommand[] = [
	'みせをひらく',
	'しいれ',
	'たたかう',
	'おわる',
];

// === ショップ画面の状態 ===

export type ShopMode = 'menu' | 'buy' | 'sell';

export type ShopState = {
	gold: number;
	inventory: Item[];
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
	shop: ShopState;
	sellShop: SellShopState;
};
