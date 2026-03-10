export interface ItemEffect {
  heal?: number;       // fraction of maxHp to restore (0-1)
  cureStatus?: boolean; // cure burn or paralyze
  revive?: boolean;    // revive fainted fish at 25% HP
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  effect: ItemEffect;
  icon: string;
}

export const ITEMS: Record<string, ItemDefinition> = {
  sea_biscuit: {
    id: 'sea_biscuit',
    name: 'Sea Biscuit',
    description: 'Restores 15% HP.',
    effect: { heal: 0.15 },
    icon: '🍪',
  },
  small_potion: {
    id: 'small_potion',
    name: 'Grog Potion',
    description: 'Restores 30% HP.',
    effect: { heal: 0.30 },
    icon: '⚗️',
  },
  big_potion: {
    id: 'big_potion',
    name: "Captain's Rum",
    description: 'Restores 60% HP.',
    effect: { heal: 0.60 },
    icon: '🍶',
  },
  antidote: {
    id: 'antidote',
    name: 'Antidote',
    description: 'Cures burn or paralysis.',
    effect: { cureStatus: true },
    icon: '💊',
  },
  revive: {
    id: 'revive',
    name: 'Revive',
    description: 'Revives a fainted fish at 25% HP.',
    effect: { revive: true },
    icon: '✨',
  },
};

export function startingInventory(): Record<string, number> {
  return { small_potion: 3 };
}
