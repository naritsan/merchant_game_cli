export type ItemType = 'weapon' | 'armor' | 'item';


export type ItemId =
    | 'copper_sword'
    | 'iron_sword'
    | 'steel_sword'
    | 'leather_shield'
    | 'iron_shield'
    | 'cloth_clothes'
    | 'chain_mail'
    | 'herb'
    | 'antidote'
    | 'chimera_wing';

export type ItemData = {
    id: ItemId;
    name: string;
    price: number;
    type: ItemType;
    description: string;
    attack?: number;
    defense?: number;
};

export const ITEMS: Record<ItemId, ItemData> = {
    'copper_sword': {
        id: 'copper_sword',
        name: 'どうのつるぎ',
        price: 100,
        type: 'weapon',
        attack: 5,
        description: '初心者向けの剣'
    },
    'iron_sword': {
        id: 'iron_sword',
        name: 'てつのつるぎ',
        price: 500,
        type: 'weapon',
        attack: 15,
        description: '鉄で作られた剣'
    },
    'steel_sword': {
        id: 'steel_sword',
        name: 'はがねのつるぎ',
        price: 1500,
        type: 'weapon',
        attack: 30,
        description: '鋼で作られた鋭い剣'
    },
    'leather_shield': {
        id: 'leather_shield',
        name: 'かわのたて',
        price: 80,
        type: 'armor',
        defense: 3,
        description: '革で作られた盾'
    },
    'iron_shield': {
        id: 'iron_shield',
        name: 'てつのたて',
        price: 300,
        type: 'armor',
        defense: 10,
        description: '鉄で作られた盾'
    },
    'cloth_clothes': {
        id: 'cloth_clothes',
        name: 'ぬののふく',
        price: 50,
        type: 'armor',
        defense: 2,
        description: '普通の布の服'
    },
    'chain_mail': {
        id: 'chain_mail',
        name: 'くさりかたびら',
        price: 800,
        type: 'armor',
        defense: 18,
        description: '鎖を編んで作られた鎧'
    },
    'herb': {
        id: 'herb',
        name: 'やくそう',
        price: 10,
        type: 'item',
        description: 'HPを少し回復する'
    },
    'antidote': {
        id: 'antidote',
        name: 'どくけしそう',
        price: 15,
        type: 'item',
        description: 'どくをなおす草'
    },
    'chimera_wing': {
        id: 'chimera_wing',
        name: 'キメラのつばさ',
        price: 30,
        type: 'item',
        description: '拠点にもどる翼'
    }
};

export function getItem(id: ItemId): ItemData {
    return ITEMS[id];
}

export function getAllItems(): ItemData[] {
    return Object.values(ITEMS);
}
