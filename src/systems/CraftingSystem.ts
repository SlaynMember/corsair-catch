/**
 * Simple crafting system
 * - Craft basic fishing rod from wood
 * - More complex recipes can be added later
 */

export interface RecipeInput {
  itemId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  inputs: RecipeInput[];
  output: {
    itemId: string;
    quantity: number;
  };
  level: number; // Minimum level to craft
  description: string;
}

// All available recipes
export const RECIPES: Record<string, Recipe> = {
  basic_fishing_rod: {
    id: 'basic_fishing_rod',
    name: 'Basic Fishing Rod',
    inputs: [
      { itemId: 'wood', quantity: 3 },
      { itemId: 'twine', quantity: 2 },
    ],
    output: { itemId: 'fishing_rod_basic', quantity: 1 },
    level: 0,
    description: 'A simple rod made from wood and twine',
  },
  sturdy_fishing_rod: {
    id: 'sturdy_fishing_rod',
    name: 'Sturdy Fishing Rod',
    inputs: [
      { itemId: 'wood', quantity: 5 },
      { itemId: 'twine', quantity: 4 },
      { itemId: 'metal_ring', quantity: 1 },
    ],
    output: { itemId: 'fishing_rod_sturdy', quantity: 1 },
    level: 5,
    description: 'A sturdier rod for stronger fish',
  },
};

/**
 * Check if a recipe can be crafted with current inventory
 */
export function canCraft(recipe: Recipe, inventory: Record<string, number>): boolean {
  return recipe.inputs.every(input => (inventory[input.itemId] ?? 0) >= input.quantity);
}

/**
 * Craft a recipe, consuming inputs and producing output
 * Returns true if successful, false if inputs are insufficient
 */
export function craft(recipe: Recipe, inventory: Record<string, number>): boolean {
  if (!canCraft(recipe, inventory)) return false;

  // Consume inputs
  for (const input of recipe.inputs) {
    inventory[input.itemId] = (inventory[input.itemId] ?? 0) - input.quantity;
    if (inventory[input.itemId] === 0) delete inventory[input.itemId];
  }

  // Produce output
  inventory[recipe.output.itemId] = (inventory[recipe.output.itemId] ?? 0) + recipe.output.quantity;

  return true;
}

/**
 * Get all craftable recipes (can be crafted now with current inventory)
 */
export function getCraftableRecipes(inventory: Record<string, number>): Recipe[] {
  return Object.values(RECIPES).filter(recipe => canCraft(recipe, inventory));
}

/**
 * Get next recipe to craft (next recipe that's not yet craftable)
 */
export function getNextUnlockedRecipe(inventory: Record<string, number>): Recipe | null {
  for (const recipe of Object.values(RECIPES)) {
    if (!canCraft(recipe, inventory)) {
      return recipe;
    }
  }
  return null;
}
