import { UIManager } from './UIManager';
import { RECIPES, canCraft, type Recipe } from '../systems/CraftingSystem';

/**
 * Show crafting menu
 */
export function showCraftingMenu(
  ui: UIManager,
  inventory: Record<string, number>,
  onCraft: (recipeId: string) => void,
  onClose: () => void
): void {
  const recipes = Object.values(RECIPES);

  const recipeHtml = recipes
    .map((recipe) => {
      const canMake = canCraft(recipe, inventory);
      const inputsHtml = recipe.inputs
        .map(({ itemId, quantity }) => {
          const have = inventory[itemId] ?? 0;
          const enoughColor = have >= quantity ? 'var(--hp-green)' : 'var(--hp-red)';
          return `<div style="font-size:7px;color:${enoughColor};">● ${itemId}: ${have}/${quantity}</div>`;
        })
        .join('');

      const buttonHtml = canMake
        ? `<button class="crafting-btn-make" onclick="craftNow('${recipe.id}')">CRAFT</button>`
        : `<button class="crafting-btn-locked" disabled>LOCKED</button>`;

      return `
        <div class="crafting-recipe-card" style="
          background: #1A1410;
          border: 2px solid #8B6B4D;
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 2px;
        ">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
            <div style="flex:1;">
              <div style="font-family:var(--pixel-font);font-size:10px;color:var(--gold);font-weight:bold;margin-bottom:6px;">
                ${recipe.name}
              </div>
              <div style="font-size:8px;color:var(--text-dim);margin-bottom:8px;">
                ${recipe.description}
              </div>
              <div style="font-size:8px;color:var(--text-dim);font-weight:bold;margin-bottom:4px;">NEEDS:</div>
              ${inputsHtml}
            </div>
            <div style="width:60px;">
              ${buttonHtml}
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  const panel = ui.show(
    'crafting-menu',
    `<div class="crafting-panel" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #0a0a18;
      border: 4px solid #8B6B4D;
      padding: 20px;
      border-radius: 4px;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.8);
    ">
      <div style="
        font-family: var(--pixel-font);
        font-size: 14px;
        color: var(--gold);
        text-align: center;
        margin-bottom: 16px;
        letter-spacing: 2px;
        border-bottom: 2px solid #8B6B4D;
        padding-bottom: 8px;
      ">
        ⚒ CRAFTING MENU ⚒
      </div>
      <div style="margin-bottom: 12px;">
        ${recipeHtml}
      </div>
      <button onclick="closeCrafting()" style="
        width: 100%;
        background: #8B6B4D;
        color: #0a0a18;
        border: 2px solid #5C3A1E;
        padding: 10px;
        font-family: var(--pixel-font);
        font-size: 10px;
        cursor: pointer;
        border-radius: 2px;
        font-weight: bold;
      ">CLOSE</button>
    </div>`
  );

  // Set up event listeners
  (window as any).craftNow = (recipeId: string) => {
    onCraft(recipeId);
    ui.hide('crafting-menu');
  };

  (window as any).closeCrafting = () => {
    ui.hide('crafting-menu');
    onClose();
  };
}

export function hideCraftingMenu(ui: UIManager): void {
  ui.hide('crafting-menu');
}
