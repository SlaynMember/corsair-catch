import { Container, Graphics } from 'pixi.js';
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
import { saveGame } from '../core/SaveManager';
import { createShip } from '../components/ShipComponent';
import type { FishInstance } from '../data/fish-db';

// Player character walking speed (world units per second)
const WALK_SPEED = 60;
const PLAYER_SIZE = 16; // Half-size of player sprite for collision

// Island map dimensions (world units)
const ISLAND_MAP_SIZE = 400;

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
  private islandGraphics!: Graphics;
  private fishingSpotsGraphics!: Graphics;
  private dockGraphics!: Graphics;
  private promptGraphics!: Graphics;
  private elapsedTime = 0;
  private inventoryOpen = false;
  private settingsOpen = false;
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

    // Camera — zoomed in for on-foot exploration
    this.camera = new Camera2D(4.0, 0.15);

    // Initialize ship data (party, items, etc.)
    if (this.loadedSave) {
      this.shipData = createShip('Player', true, this.loadedSave.maxPartySize ?? 3);
      this.shipData.party = this.loadedSave.party;
      if (this.loadedSave.items) this.shipData.items = this.loadedSave.items;
      if (this.loadedSave.gold !== undefined) this.shipData.gold = this.loadedSave.gold;
      if (this.loadedSave.baitInventory) this.shipData.baitInventory = this.loadedSave.baitInventory;
      if (this.loadedSave.discoveredTreasures) this.shipData.discoveredTreasures = this.loadedSave.discoveredTreasures;
      this.playtime = this.loadedSave.playtime ?? 0;
    } else {
      this.shipData = createShip('Player', true, 3);
      this.shipData.items = { small_potion: 3 };
    }

    // Set up island map
    this.setupIslandMap(island);

    // Player starts at center of island (beach area)
    this.playerX = 0;
    this.playerZ = 30; // Slightly below center — on the beach

    // Draw the island environment
    this.islandGraphics = new Graphics();
    this.pixiCtx.worldLayer.addChild(this.islandGraphics);
    this.drawIslandMap(island);

    // Fishing spots
    this.fishingSpotsGraphics = new Graphics();
    this.pixiCtx.worldLayer.addChild(this.fishingSpotsGraphics);

    // Dock
    this.dockGraphics = new Graphics();
    this.pixiCtx.worldLayer.addChild(this.dockGraphics);
    this.drawDock();

    // Player character sprite (drawn on top)
    this.playerGraphics = new Graphics();
    this.pixiCtx.worldLayer.addChild(this.playerGraphics);

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
    // Dock at bottom of island
    this.dockX = 0;
    this.dockZ = ISLAND_MAP_SIZE / 2 - 20;

    // Create fishing spots along the shoreline
    const r = ISLAND_MAP_SIZE / 2 - 30;
    // Find zones associated with this island's biome
    const matchingZone = ZONES.find(z => {
      // Match by proximity to island in world coords
      const dx = z.position.x - island.x;
      const dz = z.position.z - island.z;
      return Math.sqrt(dx * dx + dz * dz) < 500;
    }) ?? ZONES[0];

    // Place 3-4 fishing spots around the shore
    const spotAngles = [-Math.PI * 0.3, Math.PI * 0.1, Math.PI * 0.5, -Math.PI * 0.7];
    for (let i = 0; i < spotAngles.length; i++) {
      const angle = spotAngles[i];
      this.fishingSpots.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        zoneId: matchingZone.id,
      });
    }

    // Dig spots
    this.digSpots = [
      { x: -60, z: -40, id: `${island.id}_dig_1`, discovered: false },
      { x: 70, z: 20, id: `${island.id}_dig_2`, discovered: false },
    ];

    // Mark already-discovered treasures
    const discovered = this.shipData.discoveredTreasures ?? [];
    for (const spot of this.digSpots) {
      if (discovered.includes(spot.id)) spot.discovered = true;
    }
  }

  private drawIslandMap(island: IslandData): void {
    const g = this.islandGraphics;
    g.clear();

    const halfMap = ISLAND_MAP_SIZE / 2;

    // Ocean background (fills the whole map area generously)
    const oceanPad = 200;
    g.rect(-halfMap - oceanPad, -halfMap - oceanPad, ISLAND_MAP_SIZE + oceanPad * 2, ISLAND_MAP_SIZE + oceanPad * 2)
      .fill({ color: 0x2DAFB8 });

    // Shallow water ring
    g.ellipse(0, 0, halfMap + 20, halfMap + 15)
      .fill({ color: 0x3AC8D8, alpha: 0.6 });

    // Sandy beach (island base)
    g.ellipse(0, 0, halfMap - 10, halfMap - 15)
      .fill({ color: 0xF4C87A });

    // Inner grassy area
    g.ellipse(0, -15, halfMap - 50, halfMap - 55)
      .fill({ color: 0x6B8E23, alpha: 0.6 });

    // Path from center to dock
    g.rect(-12, 20, 24, halfMap - 40)
      .fill({ color: 0xD4A86A });

    // Palm trees (simple pixel art style)
    const palmPositions = [
      { x: -80, z: -60 }, { x: 90, z: -70 },
      { x: -110, z: 20 }, { x: 120, z: -10 },
      { x: -40, z: -100 }, { x: 60, z: -90 },
    ];
    for (const p of palmPositions) {
      // Trunk
      g.rect(p.x - 2, p.z - 20, 4, 24).fill({ color: 0x8B6B4D });
      // Fronds (green circles)
      g.circle(p.x, p.z - 22, 14).fill({ color: 0x228B22, alpha: 0.8 });
      g.circle(p.x - 8, p.z - 18, 10).fill({ color: 0x2E8B2E, alpha: 0.7 });
      g.circle(p.x + 8, p.z - 18, 10).fill({ color: 0x2E8B2E, alpha: 0.7 });
    }

    // Fishing spot markers (glowing cyan ripples)
    for (const spot of this.fishingSpots) {
      g.circle(spot.x, spot.z, 12).fill({ color: 0x00E5FF, alpha: 0.3 });
      g.circle(spot.x, spot.z, 8).fill({ color: 0x00E5FF, alpha: 0.5 });
      g.circle(spot.x, spot.z, 4).fill({ color: 0xFFFFFF, alpha: 0.4 });
    }

    // Dig spot X markers (if not discovered)
    for (const spot of this.digSpots) {
      if (!spot.discovered) {
        // X mark
        g.moveTo(spot.x - 6, spot.z - 6).lineTo(spot.x + 6, spot.z + 6)
          .stroke({ width: 2, color: 0x8B4513 });
        g.moveTo(spot.x + 6, spot.z - 6).lineTo(spot.x - 6, spot.z + 6)
          .stroke({ width: 2, color: 0x8B4513 });
      }
    }

    // Island name label area (small sign near center)
    const nameIsland = ISLANDS.find(i => i.id === this.islandId);
    if (nameIsland) {
      g.roundRect(-50, -halfMap + 10, 100, 18, 4).fill({ color: 0x8B5E3C });
      g.roundRect(-48, -halfMap + 12, 96, 14, 3).fill({ color: 0xF0E8D8 });
    }
  }

  private drawDock(): void {
    const g = this.dockGraphics;
    g.clear();

    // Wooden dock planks extending into water
    const dockWidth = 30;
    const dockLength = 50;
    const dockY = this.dockZ - 10;

    // Dock structure
    g.rect(this.dockX - dockWidth / 2, dockY, dockWidth, dockLength)
      .fill({ color: 0x8B5E3C });

    // Plank lines
    for (let i = 0; i < 5; i++) {
      const py = dockY + i * 10;
      g.moveTo(this.dockX - dockWidth / 2, py)
        .lineTo(this.dockX + dockWidth / 2, py)
        .stroke({ width: 1, color: 0x6B4E2C, alpha: 0.5 });
    }

    // Dock posts
    g.circle(this.dockX - dockWidth / 2 + 3, dockY + dockLength - 5, 3)
      .fill({ color: 0x6B4E2C });
    g.circle(this.dockX + dockWidth / 2 - 3, dockY + dockLength - 5, 3)
      .fill({ color: 0x6B4E2C });
  }

  private drawPlayer(): void {
    const g = this.playerGraphics;
    g.clear();

    const px = this.playerX;
    const py = this.playerZ;

    // Walk bob effect
    const bobY = this.playerMoving ? Math.sin(this.walkFrame * Math.PI) * 1.5 : 0;

    // Shadow
    g.ellipse(px, py + 8, 8, 3).fill({ color: 0x000000, alpha: 0.25 });

    // Body (chunky pixel art pirate)
    // Legs (2 rectangles, animate when walking)
    const legOffset = this.playerMoving ? Math.sin(this.walkFrame * Math.PI * 2) * 3 : 0;
    g.rect(px - 5, py + 1 - bobY, 4, 7).fill({ color: 0x3B2817 }); // left leg
    g.rect(px + 1, py + 1 - bobY + legOffset * 0.3, 4, 7).fill({ color: 0x3B2817 }); // right leg

    // Torso
    g.rect(px - 6, py - 8 - bobY, 12, 10).fill({ color: 0x2266AA }); // blue shirt

    // Belt
    g.rect(px - 6, py - bobY, 12, 2).fill({ color: 0x8B5E3C });

    // Arms
    const armSwing = this.playerMoving ? Math.sin(this.walkFrame * Math.PI * 2) * 2 : 0;
    g.rect(px - 8, py - 6 - bobY + armSwing, 3, 8).fill({ color: 0xFFCCAA }); // left arm
    g.rect(px + 5, py - 6 - bobY - armSwing, 3, 8).fill({ color: 0xFFCCAA }); // right arm

    // Head
    g.rect(px - 5, py - 16 - bobY, 10, 8).fill({ color: 0xFFCCAA }); // skin

    // Bandana (red)
    g.rect(px - 6, py - 17 - bobY, 12, 3).fill({ color: 0xCC3333 });

    // Eyes (direction-based)
    if (this.playerFacing === 'left') {
      g.rect(px - 4, py - 13 - bobY, 2, 2).fill({ color: 0x111111 });
    } else if (this.playerFacing === 'right') {
      g.rect(px + 2, py - 13 - bobY, 2, 2).fill({ color: 0x111111 });
    } else if (this.playerFacing === 'up') {
      // Back of head — no eyes visible
    } else {
      // Down — both eyes
      g.rect(px - 3, py - 13 - bobY, 2, 2).fill({ color: 0x111111 });
      g.rect(px + 1, py - 13 - bobY, 2, 2).fill({ color: 0x111111 });
    }

    // Y-sort: set zIndex based on position
    g.zIndex = py + 10;
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

    // Inventory
    if (this.input.wasPressed('KeyI')) {
      this.inventoryOpen = true;
      showInventory(this.ui, this.shipData.party, () => {
        this.inventoryOpen = false;
        hideInventory(this.ui);
      });
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

    // Boundary check — keep player on island
    const halfMap = ISLAND_MAP_SIZE / 2 - 15;
    const distFromCenter = Math.sqrt(newX * newX + newZ * newZ);
    if (distFromCenter < halfMap + 30) { // Allow slightly past edge for dock
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
    this.drawPlayer();

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

        // Redraw island to remove X marker
        const island = ISLANDS.find(i => i.id === this.islandId) ?? ISLANDS[0];
        this.drawIslandMap(island);
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

    // Destroy graphics
    if (this.playerGraphics) this.playerGraphics.destroy();
    if (this.islandGraphics) this.islandGraphics.destroy();
    if (this.fishingSpotsGraphics) this.fishingSpotsGraphics.destroy();
    if (this.dockGraphics) this.dockGraphics.destroy();
    if (this.promptGraphics) this.promptGraphics.destroy();
  }
}
