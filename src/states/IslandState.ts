import { Graphics, Sprite, Assets } from 'pixi.js';
import type { GameState, StateMachine } from '../core/StateMachine';
import type { InputManager } from '../core/InputManager';
import type { PixiContext } from '../rendering/PixiContext';
import type { UIManager } from '../ui/UIManager';
import type { ShipComponent } from '../components/ShipComponent';
import { Camera2D } from '../rendering/Camera2D';
import { ISLANDS, type IslandData } from '../world/WorldManager2D';
import { SailingState, type SaveData } from './SailingState';
import { FishingState } from './FishingState';
import { ZONES } from '../data/zone-db';
import { audio } from '../core/AudioManager';
import { showHUD, hideHUD } from '../ui/HUD';
import { showInventory, hideInventory } from '../ui/InventoryUI';
import { showSettings, hideSettings } from '../ui/SettingsUI';
import { showIslandUI, hideIslandUI } from '../ui/DockingUI';
import { showCraftingMenu, hideCraftingMenu } from '../ui/CraftingUI';
import { saveGame } from '../core/SaveManager';
import { createShip } from '../components/ShipComponent';
import { PirateAnimator } from '../rendering/PirateAnimator';
import { craft, RECIPES } from '../systems/CraftingSystem';
import type { FishInstance } from '../data/fish-db';

// Player character walking speed (world units per second)
const WALK_SPEED = 60;
const PLAYER_SIZE = 16; // Half-size of player sprite for collision


// Island map dimensions (world units)
const ISLAND_MAP_SIZE = 400;

// Background image is 1344x768 pixels. We scale it to fit ISLAND_MAP_SIZE width.
// That gives us a world-space height proportional to the image aspect ratio.
const BG_ASPECT = 768 / 1344;
const BG_WORLD_W = ISLAND_MAP_SIZE + 200; // generous width to fill viewport
const BG_WORLD_H = BG_WORLD_W * BG_ASPECT;

// Walkable bounds — the sand area of the reference image (bottom ~45%)
// In world coordinates centered at (0,0), with Y increasing downward:
const WALK_BOUNDS = {
  left: -BG_WORLD_W * 0.35,
  right: BG_WORLD_W * 0.35,
  top: BG_WORLD_H * 0.52,     // where the water/sand boundary is (sand starts here)
  bottom: BG_WORLD_H * 0.95,  // bottom edge of sand (edge of image)
};

// Fishing spot definition
interface FishingSpot {
  x: number;
  z: number;
  zoneId: string;
}

// Dig spot definition
interface DigSpot {
  x: number;
  z: number;
  id: string;
  discovered: boolean;
}

export class IslandState implements GameState {
  private camera!: Camera2D;
  private playerX = 0;
  private playerZ = 0;
  private playerFacing: 'up' | 'down' | 'left' | 'right' = 'down';
  private playerMoving = false;
  private playerGraphics!: Graphics;
  private playerSprite: Sprite | null = null;
  private pirateAnim: PirateAnimator | null = null;
  private playerShadow!: Graphics;
  private islandSprite!: Sprite;
  private fishingSpotsGraphics!: Graphics;
  private digSpotsGraphics!: Graphics;
  private promptGraphics!: Graphics;
  private elapsedTime = 0;
  private inventoryOpen = false;
  private settingsOpen = false;
  private craftingOpen = false;
  private islandUIOpen = false;
  private saveTimer = 0;
  private playtime = 0;

  // Island-specific data
  private fishingSpots: FishingSpot[] = [];
  private digSpots: DigSpot[] = [];
  private dockX = 0;
  private dockZ = 0;

  // Ship component holds party/items data
  private shipData!: ShipComponent;

  // Walk animation
  private walkFrame = 0;
  private walkTimer = 0;

  // Near markers
  private nearFishingSpot: FishingSpot | null = null;
  private nearDock = false;

  constructor(
    private pixiCtx: PixiContext,
    private input: InputManager,
    private ui: UIManager,
    private stateMachine: StateMachine,
    private islandId: string,
    private loadedSave?: SaveData
  ) {}

  enter(): void {
    // Clean up layers
    this.pixiCtx.oceanLayer.removeChildren();
    this.pixiCtx.worldLayer.removeChildren();
    this.pixiCtx.fxLayer.removeChildren();

    const island = ISLANDS.find(i => i.id === this.islandId) ?? ISLANDS[0];

    // Camera — zoomed in for on-foot exploration (2.0 shows full island bg)
    this.camera = new Camera2D(2.0, 0.15);

    // Initialize ship data (party, items, etc.)
    if (this.loadedSave) {
      this.shipData = createShip(1, 'Player', true, this.loadedSave.maxPartySize ?? 3);
      this.shipData.party = this.loadedSave.party;
      if (this.loadedSave.items) this.shipData.items = this.loadedSave.items;
      if (this.loadedSave.gold !== undefined) this.shipData.gold = this.loadedSave.gold;
      if (this.loadedSave.baitInventory) this.shipData.baitInventory = this.loadedSave.baitInventory;
      if (this.loadedSave.discoveredTreasures) this.shipData.discoveredTreasures = this.loadedSave.discoveredTreasures;
      this.playtime = this.loadedSave.playtime ?? 0;
    } else {
      this.shipData = createShip(1, 'Player', true, 3);
      this.shipData.items = { small_potion: 3, wood: 5, twine: 3 };
    }

    // Set up island map
    this.setupIslandMap(island);

    // Player starts on the sand area
    this.playerX = 0;
    this.playerZ = WALK_BOUNDS.top + (WALK_BOUNDS.bottom - WALK_BOUNDS.top) * 0.4;

    // Background image sprite
    const bgTex = Assets.get('sprites/island-bg.png');
    if (bgTex) {
      bgTex.source.scaleMode = 'nearest';
      this.islandSprite = new Sprite(bgTex);
      this.islandSprite.anchor.set(0.5, 0.5);
      // Scale image to fill BG_WORLD_W x BG_WORLD_H world units
      this.islandSprite.width = BG_WORLD_W;
      this.islandSprite.height = BG_WORLD_H;
      this.islandSprite.zIndex = -1000;
      this.pixiCtx.worldLayer.addChild(this.islandSprite);
    } else {
      // Fallback: solid color if image missing
      this.islandSprite = new Sprite();
      this.pixiCtx.worldLayer.addChild(this.islandSprite);
    }

    // Fishing spots overlay (animated)
    this.fishingSpotsGraphics = new Graphics();
    this.pixiCtx.worldLayer.addChild(this.fishingSpotsGraphics);

    // Dig spots overlay
    this.digSpotsGraphics = new Graphics();
    this.pixiCtx.worldLayer.addChild(this.digSpotsGraphics);
    this.drawDigSpots();

    // Player shadow
    this.playerShadow = new Graphics();
    this.pixiCtx.worldLayer.addChild(this.playerShadow);

    // Player character — animated pirate sprite, fall back to procedural
    this.playerGraphics = new Graphics();
    this.pirateAnim = new PirateAnimator();
    if (this.pirateAnim.sprite.texture !== null) {
      this.playerSprite = this.pirateAnim.sprite;
      this.pixiCtx.worldLayer.addChild(this.playerSprite);
    } else {
      // Fallback: procedural drawing
      this.pirateAnim = null;
      this.pixiCtx.worldLayer.addChild(this.playerGraphics);
    }

    // Prompt text container (screen space)
    this.promptGraphics = new Graphics();
    this.pixiCtx.fxLayer.addChild(this.promptGraphics);

    // Initial camera position
    this.camera.setTarget(this.playerX, this.playerZ);
    this.camera.update(1, this.pixiCtx.worldLayer);

    // HUD
    showHUD(this.ui, this.shipData);

    audio.playBGM('sailing');
  }

  private setupIslandMap(island: IslandData): void {
    // Dock at bottom-center of the sand area (where the dock is in the background image)
    this.dockX = 0;
    this.dockZ = WALK_BOUNDS.bottom - 5;

    // Find zones associated with this island's biome
    const matchingZone = ZONES.find(z => {
      const dx = z.position.x - island.x;
      const dz = z.position.z - island.z;
      return Math.sqrt(dx * dx + dz * dz) < 500;
    }) ?? ZONES[0];

    // Fishing spots along the water's edge (top of walkable area)
    const waterEdgeZ = WALK_BOUNDS.top + 5;
    this.fishingSpots = [
      { x: -80, z: waterEdgeZ, zoneId: matchingZone.id },
      { x: 0, z: waterEdgeZ - 5, zoneId: matchingZone.id },
      { x: 80, z: waterEdgeZ, zoneId: matchingZone.id },
    ];

    // Dig spots on the sand
    const sandMidZ = (WALK_BOUNDS.top + WALK_BOUNDS.bottom) / 2;
    this.digSpots = [
      { x: -60, z: sandMidZ + 10, id: `${island.id}_dig_1`, discovered: false },
      { x: 70, z: sandMidZ + 20, id: `${island.id}_dig_2`, discovered: false },
    ];

    // Mark already-discovered treasures
    const discovered = this.shipData.discoveredTreasures ?? [];
    for (const spot of this.digSpots) {
      if (discovered.includes(spot.id)) spot.discovered = true;
    }
  }

  private drawDigSpots(): void {
    const g = this.digSpotsGraphics;
    g.clear();

    for (const spot of this.digSpots) {
      if (!spot.discovered) {
        g.moveTo(spot.x - 6, spot.z - 6).lineTo(spot.x + 6, spot.z + 6)
          .stroke({ width: 2, color: 0x8B4513 });
        g.moveTo(spot.x + 6, spot.z - 6).lineTo(spot.x - 6, spot.z + 6)
          .stroke({ width: 2, color: 0x8B4513 });
      }
    }
  }

  private drawPlayer(dt: number): void {
    const px = this.playerX;
    const py = this.playerZ;

    // Shadow (directly under feet)
    this.playerShadow.clear();
    this.playerShadow.ellipse(px, py + 2, 6, 2).fill({ color: 0x000000, alpha: 0.25 });
    this.playerShadow.zIndex = py + 9;

    if (this.pirateAnim) {
      // Update animation state
      this.pirateAnim.setFacing(this.playerFacing);
      this.pirateAnim.setAnim(this.playerMoving ? 'run' : 'idle');
      this.pirateAnim.update(dt);

      // Position sprite (anchor is bottom-center, so y = feet position)
      this.pirateAnim.sprite.x = px;
      this.pirateAnim.sprite.y = py + 2;
      this.pirateAnim.sprite.zIndex = py + 10;
    } else {
      // Fallback: procedural drawing
      const bobY = this.playerMoving ? Math.sin(this.walkFrame * Math.PI) * 1.5 : 0;
      const g = this.playerGraphics;
      g.clear();

      const legOffset = this.playerMoving ? Math.sin(this.walkFrame * Math.PI * 2) * 3 : 0;
      g.rect(px - 5, py + 1 - bobY, 4, 7).fill({ color: 0x3B2817 });
      g.rect(px + 1, py + 1 - bobY + legOffset * 0.3, 4, 7).fill({ color: 0x3B2817 });
      g.rect(px - 6, py - 8 - bobY, 12, 10).fill({ color: 0x2266AA });
      g.rect(px - 6, py - bobY, 12, 2).fill({ color: 0x8B5E3C });
      const armSwing = this.playerMoving ? Math.sin(this.walkFrame * Math.PI * 2) * 2 : 0;
      g.rect(px - 8, py - 6 - bobY + armSwing, 3, 8).fill({ color: 0xFFCCAA });
      g.rect(px + 5, py - 6 - bobY - armSwing, 3, 8).fill({ color: 0xFFCCAA });
      g.rect(px - 5, py - 16 - bobY, 10, 8).fill({ color: 0xFFCCAA });
      g.rect(px - 6, py - 17 - bobY, 12, 3).fill({ color: 0xCC3333 });
      if (this.playerFacing === 'down') {
        g.rect(px - 3, py - 13 - bobY, 2, 2).fill({ color: 0x111111 });
        g.rect(px + 1, py - 13 - bobY, 2, 2).fill({ color: 0x111111 });
      } else if (this.playerFacing === 'left') {
        g.rect(px - 4, py - 13 - bobY, 2, 2).fill({ color: 0x111111 });
      } else if (this.playerFacing === 'right') {
        g.rect(px + 2, py - 13 - bobY, 2, 2).fill({ color: 0x111111 });
      }
      g.zIndex = py + 10;
    }
  }

  update(dt: number): void {
    this.elapsedTime += dt;
    this.playtime += dt;

    // Settings
    if (this.settingsOpen) {
      if (this.input.wasPressed('Escape')) {
        this.settingsOpen = false;
        hideSettings(this.ui);
      }
      return;
    }

    // Island UI
    if (this.islandUIOpen) {
      if (this.input.wasPressed('Escape')) {
        this.islandUIOpen = false;
        hideIslandUI(this.ui);
      }
      return;
    }

    // Inventory
    if (this.inventoryOpen) {
      if (this.input.wasPressed('KeyI') || this.input.wasPressed('Escape')) {
        this.inventoryOpen = false;
        hideInventory(this.ui);
      }
      return;
    }

    // Escape → settings
    if (this.input.wasPressed('Escape')) {
      this.settingsOpen = true;
      showSettings(this.ui, () => {
        this.settingsOpen = false;
        hideSettings(this.ui);
      }, this.playtime);
      return;
    }

    // Inventory (TAB key)
    if (this.input.wasPressed('Tab')) {
      this.inventoryOpen = true;
      showInventory(this.ui, this.shipData.party, () => {
        this.inventoryOpen = false;
        hideInventory(this.ui);
      });
      return;
    }

    // Crafting (C key)
    if (this.input.wasPressed('KeyC')) {
      this.craftingOpen = true;
      showCraftingMenu(
        this.ui,
        this.shipData.items,
        (recipeId) => {
          const recipe = RECIPES[recipeId];
          if (recipe && craft(recipe, this.shipData.items)) {
            audio.playSFX('level_up');
            this.ui.show('craft-message', `<div style="
              position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
              background: #2A1810; border: 2px solid #9D6113; padding: 16px;
              font-family: var(--pixel-font); color: var(--gold); text-align: center;
              z-index: 2000;
            ">✓ CRAFTED!</div>`);
            setTimeout(() => this.ui.hide('craft-message'), 1500);
          }
        },
        () => {
          this.craftingOpen = false;
          hideCraftingMenu(this.ui);
        }
      );
      return;
    }

    // Movement (4-directional, Pokemon Diamond style)
    let dx = 0;
    let dz = 0;
    if (this.input.isDown('KeyW') || this.input.isDown('ArrowUp')) { dz = -1; this.playerFacing = 'up'; }
    if (this.input.isDown('KeyS') || this.input.isDown('ArrowDown')) { dz = 1; this.playerFacing = 'down'; }
    if (this.input.isDown('KeyA') || this.input.isDown('ArrowLeft')) { dx = -1; this.playerFacing = 'left'; }
    if (this.input.isDown('KeyD') || this.input.isDown('ArrowRight')) { dx = 1; this.playerFacing = 'right'; }

    // Normalize diagonal movement
    const mag = Math.sqrt(dx * dx + dz * dz);
    if (mag > 0) {
      dx /= mag;
      dz /= mag;
    }

    this.playerMoving = mag > 0;

    // Apply movement
    const newX = this.playerX + dx * WALK_SPEED * dt;
    const newZ = this.playerZ + dz * WALK_SPEED * dt;

    // Boundary check — keep player on sand area
    if (newX >= WALK_BOUNDS.left && newX <= WALK_BOUNDS.right &&
        newZ >= WALK_BOUNDS.top && newZ <= WALK_BOUNDS.bottom) {
      this.playerX = newX;
      this.playerZ = newZ;
    }

    // Walk animation
    if (this.playerMoving) {
      this.walkTimer += dt;
      if (this.walkTimer > 0.15) {
        this.walkTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 4;
      }
    } else {
      this.walkFrame = 0;
      this.walkTimer = 0;
    }

    // Proximity checks
    this.checkProximity();

    // Interaction (Space)
    if (this.input.wasPressed('Space')) {
      this.handleInteraction();
    }

    // Camera follow (locked center, no lerp — Pokemon style)
    this.camera.setTarget(this.playerX, this.playerZ);
    this.camera.update(dt, this.pixiCtx.worldLayer);

    // Redraw player
    this.drawPlayer(dt);

    // Animate fishing spots (pulse)
    this.animateFishingSpots();

    // Update HUD
    showHUD(this.ui, this.shipData);

    // Auto-save
    this.saveTimer += dt;
    if (this.saveTimer > 10) {
      this.saveTimer = 0;
      this.doSave();
    }
  }

  private checkProximity(): void {
    // Check fishing spots
    this.nearFishingSpot = null;
    for (const spot of this.fishingSpots) {
      const dx = this.playerX - spot.x;
      const dz = this.playerZ - spot.z;
      if (dx * dx + dz * dz < 25 * 25) {
        this.nearFishingSpot = spot;
        break;
      }
    }

    // Check dock
    const dockDx = this.playerX - this.dockX;
    const dockDz = this.playerZ - this.dockZ;
    this.nearDock = dockDx * dockDx + dockDz * dockDz < 30 * 30;

    // Show prompts
    if (this.nearFishingSpot) {
      this.ui.show('island-prompt', '<div class="zone-prompt">Press SPACE to <span style="color:#00E5FF;">FISH</span></div>');
    } else if (this.nearDock) {
      this.ui.show('island-prompt', '<div class="zone-prompt">Press SPACE to <span style="color:var(--gold);">BOARD SHIP</span></div>');
    } else {
      this.ui.remove('island-prompt');
    }
  }

  private handleInteraction(): void {
    // Fish at a fishing spot
    if (this.nearFishingSpot) {
      const zone = ZONES.find(z => z.id === this.nearFishingSpot!.zoneId) ?? ZONES[0];
      this.ui.remove('island-prompt');
      this.stateMachine.push(
        new FishingState(this.pixiCtx, this.ui, this.input, this.stateMachine, zone, this.shipData)
      );
      return;
    }

    // Board ship at dock
    if (this.nearDock) {
      this.ui.remove('island-prompt');
      // Transition to SailingState with current save data
      const save: SaveData = {
        party: this.shipData.party,
        playerX: ISLANDS.find(i => i.id === this.islandId)?.x ?? 0,
        playerZ: (ISLANDS.find(i => i.id === this.islandId)?.z ?? 0) + 100,
        playerRotation: Math.PI,
        maxPartySize: this.shipData.maxPartySize,
        playtime: this.playtime,
        items: this.shipData.items,
        gold: this.shipData.gold,
        baitInventory: this.shipData.baitInventory,
        discoveredTreasures: this.shipData.discoveredTreasures,
      };
      this.stateMachine.replace(
        new SailingState(this.pixiCtx, this.input, this.ui, this.stateMachine, save)
      );
      return;
    }

    // Check dig spots
    for (const spot of this.digSpots) {
      if (spot.discovered) continue;
      const dx = this.playerX - spot.x;
      const dz = this.playerZ - spot.z;
      if (dx * dx + dz * dz < 20 * 20) {
        spot.discovered = true;
        // Add to discovered treasures
        if (!this.shipData.discoveredTreasures) this.shipData.discoveredTreasures = [];
        this.shipData.discoveredTreasures.push(spot.id);
        // Give gold reward
        this.shipData.gold = (this.shipData.gold ?? 0) + 50;
        audio.playSFX('catch');

        this.ui.show('dig-popup', `<div style="
          position:absolute; top:30%; left:50%; transform:translateX(-50%);
          background:var(--panel-bg); border:3px solid var(--gold);
          padding:16px 24px; text-align:center; z-index:70;
          box-shadow:4px 4px 0 rgba(0,0,0,0.5); animation:catchPop 0.3s steps(4);
        ">
          <div style="font-family:var(--pixel-font); font-size:10px; color:var(--gold); margin-bottom:8px;">TREASURE FOUND!</div>
          <div style="font-family:var(--pixel-font); font-size:8px; color:var(--text);">+50 Gold</div>
        </div>`);
        setTimeout(() => this.ui.remove('dig-popup'), 2000);

        // Redraw dig spots to remove X marker
        this.drawDigSpots();
        return;
      }
    }
  }

  private animateFishingSpots(): void {
    const fg = this.fishingSpotsGraphics;
    fg.clear();

    for (const spot of this.fishingSpots) {
      // Pulsing ripple animation
      const pulse = 0.5 + Math.sin(this.elapsedTime * 2) * 0.3;
      const outerR = 14 + Math.sin(this.elapsedTime * 1.5) * 3;
      fg.circle(spot.x, spot.z, outerR).fill({ color: 0x00E5FF, alpha: pulse * 0.25 });
      fg.circle(spot.x, spot.z, 8).fill({ color: 0x00E5FF, alpha: pulse * 0.5 });
      fg.circle(spot.x, spot.z, 3).fill({ color: 0xFFFFFF, alpha: pulse * 0.6 });
    }
  }

  private doSave(): void {
    const island = ISLANDS.find(i => i.id === this.islandId);
    saveGame({
      shipId: this.shipData.shipId,
      party: this.shipData.party,
      playerX: island?.x ?? 0,
      playerZ: island?.z ?? 0,
      playerRotation: 0,
      maxPartySize: this.shipData.maxPartySize,
      playtime: this.playtime,
      items: this.shipData.items,
      gold: this.shipData.gold,
      baitInventory: this.shipData.baitInventory,
      discoveredTreasures: this.shipData.discoveredTreasures,
    });
  }

  resume(): void {
    // Re-entering from fishing or battle
    audio.playBGM('sailing');
  }

  render(_interpolation: number): void {
    this.pixiCtx.app.renderer.render(this.pixiCtx.app.stage);
  }

  exit(): void {
    hideHUD(this.ui);
    this.ui.remove('island-prompt');
    this.ui.remove('dig-popup');

    if (this.islandUIOpen) {
      hideIslandUI(this.ui);
      this.islandUIOpen = false;
    }

    // Destroy graphics/sprites
    if (this.pirateAnim) this.pirateAnim.destroy();
    if (this.playerGraphics) this.playerGraphics.destroy();
    if (this.islandSprite) this.islandSprite.destroy();
    if (this.fishingSpotsGraphics) this.fishingSpotsGraphics.destroy();
    if (this.digSpotsGraphics) this.digSpotsGraphics.destroy();
    if (this.promptGraphics) this.promptGraphics.destroy();
  }
}
