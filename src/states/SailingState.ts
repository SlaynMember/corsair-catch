import { Container, Graphics } from 'pixi.js';
import type { GameState, StateMachine } from '../core/StateMachine';
import { World, Entity } from '../core/ECS';
import { EventBus } from '../core/EventBus';
import type { InputManager } from '../core/InputManager';
import type { PixiContext } from '../rendering/PixiContext';
import { Camera2D } from '../rendering/Camera2D';
import { Ocean2D } from '../world/Ocean2D';
import { spawnWorld2D, updateZoneVisuals, ISLANDS } from '../world/WorldManager2D';
import { MovementSystem } from '../systems/MovementSystem';
import { AISystem } from '../systems/AISystem';
import { CollisionSystem, CollisionEvent } from '../systems/CollisionSystem';
import type { TransformComponent } from '../components/TransformComponent';
import type { VelocityComponent } from '../components/VelocityComponent';
import type { ShipComponent } from '../components/ShipComponent';
import type { AIPatrolComponent } from '../components/AIPatrolComponent';
import type { MeshComponent } from '../components/MeshComponent';
import type { UIManager } from '../ui/UIManager';
import { showHUD, updateMinimap, hideHUD, MinimapEntity } from '../ui/HUD';
import { showInventory, hideInventory } from '../ui/InventoryUI';
import { showIslandUI, hideIslandUI } from '../ui/DockingUI';
import { FishingState } from './FishingState';
import { BattleState as BattleGameState } from './BattleState';
import { playBattleIntro } from '../ui/TransitionUI';
import { showTutorial } from '../ui/TutorialUI';
import { showSettings, hideSettings } from '../ui/SettingsUI';
import { FISH_SPECIES, calcStat } from '../data/fish-db';
import { ZONES } from '../data/zone-db';
import { distanceSq } from '../utils/math';
import { WORLD_BOUNDARY } from '../data/constants';
import { audio } from '../core/AudioManager';
import { saveGame } from '../core/SaveManager';
import type { FishInstance } from '../data/fish-db';

export interface SaveData {
  party: FishInstance[];
  playerX: number;
  playerZ: number;
  playerRotation: number;
  maxPartySize?: number;
  playtime?: number;
  items?: Record<string, number>;
  gold?: number;
  baitInventory?: Record<string, number>;
  discoveredTreasures?: string[];
}

// Wake particle for 2D
interface WakeParticle {
  x: number;
  z: number;
  life: number;
  maxLife: number;
  size: number;
}

// Atmosphere particle for biome effects
interface AtmosphereParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
}

export class SailingState implements GameState {
  private world!: World;
  private eventBus!: EventBus;
  private ocean!: Ocean2D;
  private camera!: Camera2D;
  private playerEntity!: Entity;
  private zoneContainers: Container[] = [];
  private islandContainers: Container[] = [];
  private inventoryOpen = false;
  private nearZoneId: string | null = null;
  private nearDockIslandId: string | null = null;
  private dockHealCooldown = 0;
  private cleanupFns: (() => void)[] = [];
  private elapsedTime = 0;
  private transitioning = false;
  private tutorialShown = false;
  private saveTimer = 0;
  private healTimer = 0;
  private settingsOpen = false;
  private islandUIOpen = false;
  private allDefeatedShown = false;
  private playtime = 0;
  private wakeParticles: WakeParticle[] = [];
  private wakeTimer = 0;
  private wakeGraphics!: Graphics;
  private seagullGraphics!: Graphics;
  private seagulls: { x: number; z: number; offset: number; size: number; wingOpen: boolean; flapTimer: number }[] = [];
  private atmosphereParticles: AtmosphereParticle[] = [];
  private atmosphereGraphics!: Graphics;
  private atmosphereTimer = 0;
  private nearBiome: string | null = null;
  private lightningTimer = 0;
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private pixiCtx: PixiContext,
    private input: InputManager,
    private ui: UIManager,
    private stateMachine: StateMachine,
    private loadedSave?: SaveData
  ) {}

  enter(): void {
    // Clean up any lingering pixi objects from a previous session
    this.pixiCtx.oceanLayer.removeChildren();
    this.pixiCtx.worldLayer.removeChildren();
    this.pixiCtx.fxLayer.removeChildren();

    this.world = new World();
    this.eventBus = new EventBus();

    // Ocean (screen-space animated water bands)
    this.ocean = new Ocean2D();
    this.pixiCtx.oceanLayer.addChild(this.ocean.displayObject);

    // Camera
    this.camera = new Camera2D(7.0, 0.1);

    // Spawn world entities
    const result = spawnWorld2D(this.world, this.pixiCtx.worldLayer);
    this.playerEntity = result.playerEntity;
    this.zoneContainers = result.zoneContainers;
    this.islandContainers = result.islandContainers;

    // Restore save data
    if (this.loadedSave) {
      const transform = this.playerEntity.getComponent<TransformComponent>('transform');
      const ship = this.playerEntity.getComponent<ShipComponent>('ship');
      transform.x = this.loadedSave.playerX;
      transform.z = this.loadedSave.playerZ;
      transform.rotationY = this.loadedSave.playerRotation;
      ship.party = this.loadedSave.party;
      if (this.loadedSave.maxPartySize) ship.maxPartySize = this.loadedSave.maxPartySize;
      if (this.loadedSave.items) ship.items = this.loadedSave.items;
      if (this.loadedSave.gold !== undefined) ship.gold = this.loadedSave.gold;
      if (this.loadedSave.baitInventory) ship.baitInventory = this.loadedSave.baitInventory;
      if (this.loadedSave.discoveredTreasures) ship.discoveredTreasures = this.loadedSave.discoveredTreasures;
      this.playtime = this.loadedSave.playtime ?? 0;
      this.tutorialShown = true;
      this.loadedSave = undefined;
    } else {
      const ship = this.playerEntity.getComponent<ShipComponent>('ship');
      ship.items = { small_potion: 3 };
    }

    // Sync initial player position
    const mesh = this.playerEntity.getComponent<MeshComponent>('mesh');
    const transform = this.playerEntity.getComponent<TransformComponent>('transform');
    mesh.object.x = transform.x;
    mesh.object.y = transform.z;
    this.camera.setTarget(transform.x, transform.z);
    this.camera.update(1, this.pixiCtx.worldLayer);

    // ECS systems
    const getPlayerPos = () => {
      const t = this.playerEntity.getComponent<TransformComponent>('transform');
      return { x: t.x, z: t.z };
    };
    this.world.addSystem(new MovementSystem());
    this.world.addSystem(new AISystem(getPlayerPos, this.eventBus));
    this.world.addSystem(new CollisionSystem(this.eventBus));

    // Collision handler
    const unsub = this.eventBus.on<CollisionEvent>('collision', (event) => {
      this.handleCollision(event);
    });
    this.cleanupFns.push(unsub);

    // Wake trail graphics (in fxLayer, screen-offset by camera)
    this.wakeGraphics = new Graphics();
    this.pixiCtx.fxLayer.addChild(this.wakeGraphics);

    // Atmosphere particle graphics (screen space)
    this.atmosphereGraphics = new Graphics();
    this.pixiCtx.fxLayer.addChild(this.atmosphereGraphics);

    // Seagull graphics in fxLayer (screen space — ambient decoration)
    this.seagullGraphics = new Graphics();
    this.pixiCtx.fxLayer.addChild(this.seagullGraphics);

    // Spawn seagulls as screen-space ambient birds (8-12)
    const gullCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < gullCount; i++) {
      const size = 0.5 + Math.random() * 0.7; // depth variation
      this.seagulls.push({
        x: Math.random() * 800,
        z: 20 + Math.random() * 160, // wider Y spread
        offset: i * 1.3 + Math.random() * 2,
        size,
        wingOpen: Math.random() > 0.5,
        flapTimer: Math.random() * 0.3,
      });
    }

    // Show HUD
    const ship = this.playerEntity.getComponent<ShipComponent>('ship');
    showHUD(this.ui, ship);

    audio.playBGM('sailing');

    // Tutorial on first entry
    if (!this.tutorialShown) {
      this.tutorialShown = true;
      this.transitioning = true;
      showTutorial(this.ui, () => { this.transitioning = false; });
    }
  }

  private handleCollision(event: CollisionEvent): void {
    const { entityA, entityB, layerA, layerB } = event;
    const layers = [layerA, layerB];

    if (layers.includes('player') && layers.includes('enemy')) {
      const enemyEntity = layerA === 'enemy' ? entityA : entityB;
      const enemyShip = enemyEntity.getComponent<ShipComponent>('ship');
      const playerShip = this.playerEntity.getComponent<ShipComponent>('ship');

      if (!enemyShip.party.some(f => f.currentHp > 0)) return;
      if (this.transitioning) return;

      if (playerShip.party.length > 0) {
        this.transitioning = true;
        playBattleIntro(this.ui, enemyShip.name, () => {
          this.transitioning = false;
          this.stateMachine.push(
            new BattleGameState(this.pixiCtx, this.ui, this.stateMachine, playerShip, enemyShip, () => {
              if (!enemyShip.party.some(f => f.currentHp > 0)) {
                if (enemyEntity.hasComponent('ai_patrol')) {
                  const patrol = enemyEntity.getComponent<AIPatrolComponent>('ai_patrol');
                  patrol.state = 'defeated';
                }
                if (enemyEntity.hasComponent('mesh')) {
                  const meshComp = enemyEntity.getComponent<MeshComponent>('mesh');
                  meshComp.object.visible = false;
                }
              }
            })
          );
        });
      }
    }

    if (layers.includes('player') && layers.includes('island')) {
      const transform = this.playerEntity.getComponent<TransformComponent>('transform');
      const velocity = this.playerEntity.getComponent<VelocityComponent>('velocity');
      transform.x -= velocity.vx * 0.1;
      transform.z -= velocity.vz * 0.1;
      velocity.vx = 0;
      velocity.vz = 0;
    }
  }

  resume(): void {
    this.transitioning = false;
    audio.playBGM('sailing');
  }

  update(dt: number): void {
    if (this.settingsOpen) {
      if (this.input.wasPressed('Escape')) {
        this.settingsOpen = false;
        hideSettings(this.ui);
      }
      return;
    }

    if (this.islandUIOpen) {
      // Escape closes island UI
      if (this.input.wasPressed('Escape')) {
        this.islandUIOpen = false;
        hideIslandUI(this.ui);
      }
      return;
    }

    if (this.inventoryOpen) {
      if (this.input.wasPressed('KeyI') || this.input.wasPressed('Escape')) {
        this.inventoryOpen = false;
        hideInventory(this.ui);
      }
      return;
    }

    if (this.input.wasPressed('Escape') && !this.transitioning) {
      this.settingsOpen = true;
      showSettings(this.ui, () => {
        this.settingsOpen = false;
        hideSettings(this.ui);
      }, this.playtime);
      return;
    }

    if (this.input.wasPressed('KeyI')) {
      this.inventoryOpen = true;
      const ship = this.playerEntity.getComponent<ShipComponent>('ship');
      showInventory(this.ui, ship.party, () => {
        this.inventoryOpen = false;
        hideInventory(this.ui);
      });
      return;
    }

    // Dock interaction (Space near dock) — open island UI
    if (this.input.wasPressed('Space') && this.nearDockIslandId && !this.transitioning && !this.islandUIOpen) {
      const island = ISLANDS.find(i => i.id === this.nearDockIslandId);
      if (island) {
        const ship = this.playerEntity.getComponent<ShipComponent>('ship');
        this.islandUIOpen = true;
        this.ui.remove('dock-prompt');
        showIslandUI(
          this.ui,
          island,
          ship,
          ship.discoveredTreasures ?? [],
          () => {
            // Heal all crew
            for (const fish of ship.party) fish.currentHp = fish.maxHp;
            audio.playSFX('catch');
          },
          () => {
            this.islandUIOpen = false;
            hideIslandUI(this.ui);
          }
        );
      }
    }

    // Fishing interaction (Space near zone)
    if (this.input.wasPressed('Space') && this.nearZoneId && !this.transitioning && !this.nearDockIslandId) {
      const zone = ZONES.find((z) => z.id === this.nearZoneId);
      if (zone) {
        const ship = this.playerEntity.getComponent<ShipComponent>('ship');
        this.ui.remove('zone-prompt');
        this.stateMachine.push(
          new FishingState(this.pixiCtx, this.ui, this.input, this.stateMachine, zone, ship)
        );
        return;
      }
    }

    // Player movement
    const transform = this.playerEntity.getComponent<TransformComponent>('transform');
    const velocity = this.playerEntity.getComponent<VelocityComponent>('velocity');

    let moveForward = 0;
    let turnDir = 0;
    if (this.input.isDown('KeyW') || this.input.isDown('ArrowUp')) moveForward = 1;
    if (this.input.isDown('KeyS') || this.input.isDown('ArrowDown')) moveForward = -0.5;
    if (this.input.isDown('KeyA') || this.input.isDown('ArrowLeft')) turnDir = 1;
    if (this.input.isDown('KeyD') || this.input.isDown('ArrowRight')) turnDir = -1;

    transform.rotationY += turnDir * velocity.turnRate * dt;
    const speed = velocity.speed * moveForward;
    velocity.vx = Math.cos(transform.rotationY) * speed;
    velocity.vz = Math.sin(transform.rotationY) * speed;

    // Update ECS world
    this.world.update(dt);
    this.elapsedTime += dt;
    this.playtime += dt;

    // Update ocean
    this.ocean.update(dt);

    // Update zone visual pulsing
    updateZoneVisuals(this.zoneContainers, this.elapsedTime);

    // Camera follow
    this.camera.setTarget(transform.x, transform.z);
    this.camera.update(dt, this.pixiCtx.worldLayer);

    // Wake trail particles — dense, visible foam trail
    const shipSpeed = Math.sqrt(velocity.vx * velocity.vx + velocity.vz * velocity.vz);
    if (shipSpeed > 10) {
      this.wakeTimer += dt;
      if (this.wakeTimer > 0.06) {
        this.wakeTimer = 0;
        for (let side = -1; side <= 1; side += 2) {
          const lateralX = -Math.sin(transform.rotationY) * side * 18;
          const lateralZ = Math.cos(transform.rotationY) * side * 18;
          // Spawn 3-4 particles per side for density
          for (let p = 0; p < 3; p++) {
            const backOffset = 20 + p * 8;
            this.wakeParticles.push({
              x: transform.x - Math.cos(transform.rotationY) * backOffset + lateralX + (Math.random() - 0.5) * 6,
              z: transform.z - Math.sin(transform.rotationY) * backOffset + lateralZ + (Math.random() - 0.5) * 6,
              life: 0,
              maxLife: 1.2 + Math.random() * 0.3,
              size: 6 + Math.random() * 4,
            });
          }
        }
      }
    }

    // Update wake particles
    const wg = this.wakeGraphics;
    wg.clear();
    for (let i = this.wakeParticles.length - 1; i >= 0; i--) {
      const wp = this.wakeParticles[i];
      wp.life += dt;
      if (wp.life > wp.maxLife) {
        this.wakeParticles.splice(i, 1);
        continue;
      }
      const lifeRatio = 1 - wp.life / wp.maxLife;
      const screen = this.camera.worldToScreen(wp.x, wp.z);
      const r = wp.size * (1 + wp.life * 0.4);
      // Outer blue circle
      wg.circle(screen.x, screen.y, r).fill({ color: 0x88DDFF, alpha: lifeRatio * 0.5 });
      // Inner white foam core
      wg.circle(screen.x, screen.y, r * 0.5).fill({ color: 0xFFFFFF, alpha: lifeRatio * 0.3 });
    }

    // Seagulls (screen-space ambient drift with wing flap)
    const screenW = this.pixiCtx.app.renderer.width;
    this.seagullGraphics.clear();
    for (let i = 0; i < this.seagulls.length; i++) {
      const gull = this.seagulls[i];
      // Drift across screen (smaller = slower for depth)
      gull.x += (10 + i * 3) * gull.size * dt;
      if (gull.x > screenW + 50) { gull.x = -50; gull.z = 20 + Math.random() * 160; }
      // Gentle sine-wave vertical bob
      const bobY = gull.z + Math.sin(this.elapsedTime * 1.2 + gull.offset) * 4 * gull.size;
      // 2-frame wing flap toggle
      gull.flapTimer += dt;
      if (gull.flapTimer > 0.25 + gull.size * 0.1) {
        gull.flapTimer = 0;
        gull.wingOpen = !gull.wingOpen;
      }
      const wingSpan = 10 * gull.size;
      const wingDip = gull.wingOpen ? -4 * gull.size : 4 * gull.size;
      const alpha = 0.3 + gull.size * 0.35;
      const sg = this.seagullGraphics;
      sg.moveTo(gull.x - wingSpan, bobY + wingDip)
        .lineTo(gull.x, bobY - 2 * gull.size)
        .lineTo(gull.x + wingSpan, bobY + wingDip);
      sg.stroke({ width: Math.max(1, Math.round(2 * gull.size)), color: 0xffffff, alpha });
    }

    // === ATMOSPHERE PARTICLES (biome effects) ===
    // Determine nearest island biome
    this.nearBiome = null;
    let nearestDist = Infinity;
    for (const island of ISLANDS) {
      const d = distanceSq(transform.x, transform.z, island.x, island.z);
      if (d < 400 * 400 && d < nearestDist) {
        nearestDist = d;
        this.nearBiome = island.biome;
      }
    }

    // Activate bioluminescent mode near abyss biome
    this.ocean.setBioMode(this.nearBiome === 'abyss');

    this.atmosphereTimer += dt;
    const W = this.pixiCtx.app.renderer.width;
    const H = this.pixiCtx.app.renderer.height;

    if (this.nearBiome) {
      const spawnRate = this.nearBiome === 'storm' ? 0.03 : this.nearBiome === 'volcanic' ? 0.06 : 0.08;
      if (this.atmosphereTimer > spawnRate) {
        this.atmosphereTimer = 0;
        const count = this.nearBiome === 'storm' ? 10 : this.nearBiome === 'volcanic' ? 4 : 2;
        for (let i = 0; i < count; i++) {
          this.atmosphereParticles.push(this.spawnAtmosphereParticle(W, H));
        }
      }
    } else {
      this.atmosphereTimer = 0;
    }

    // Lightning flash for storm biome
    if (this.nearBiome === 'storm') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 12 + Math.random() * 8;
        const flashId = `lightning-flash-${Date.now()}`;
        this.ui.show(flashId, '<div style="position:fixed;inset:0;background:rgba(200,230,255,0.4);pointer-events:none;z-index:5;"></div>');
        this.pendingTimers.push(setTimeout(() => this.ui.remove(flashId), 80));
      }
    }

    // Update and draw atmosphere particles
    const ag = this.atmosphereGraphics;
    ag.clear();
    for (let i = this.atmosphereParticles.length - 1; i >= 0; i--) {
      const p = this.atmosphereParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      const lifeRatio = p.life / p.maxLife;
      if (p.life <= 0) { this.atmosphereParticles.splice(i, 1); continue; }
      ag.rect(p.x, p.y, p.size, p.size).fill({ color: p.color, alpha: p.alpha * lifeRatio });
    }

    // Check fishing zone proximity
    const prevZoneId = this.nearZoneId;
    this.nearZoneId = null;
    for (const zone of ZONES) {
      const d2 = distanceSq(transform.x, transform.z, zone.position.x, zone.position.z);
      if (d2 < (zone.radius + 30) * (zone.radius + 30)) {
        this.nearZoneId = zone.id;
        break;
      }
    }
    if (this.nearZoneId && this.nearZoneId !== prevZoneId) {
      const zone = ZONES.find(z => z.id === this.nearZoneId);
      const zoneName = zone?.name ?? 'this zone';
      const diffLabel = zone ? (zone.difficulty <= 1 ? 'EASY' : zone.difficulty <= 2 ? 'MEDIUM' : 'HARD') : '';
      const diffColor = zone ? (zone.difficulty <= 1 ? 'var(--hp-green)' : zone.difficulty <= 2 ? 'var(--hp-yellow)' : 'var(--hp-red)') : 'var(--text-dim)';
      this.ui.show('zone-prompt', `<div class="zone-prompt">Press SPACE to fish at ${zoneName} <span style="color:${diffColor}; margin-left:8px;">[${diffLabel}]</span></div>`);
    } else if (!this.nearZoneId && prevZoneId) {
      this.ui.remove('zone-prompt');
    }

    // Check dock proximity (near any island dock)
    const prevDockId = this.nearDockIslandId;
    this.nearDockIslandId = null;
    for (const island of ISLANDS) {
      const dockX = island.x;
      const dockZ = island.z + island.radius * 0.6 + 20;
      const d2 = distanceSq(transform.x, transform.z, dockX, dockZ);
      if (d2 < 80 * 80) {
        this.nearDockIslandId = island.id;
        break;
      }
    }
    if (this.nearDockIslandId && this.nearDockIslandId !== prevDockId) {
      const island = ISLANDS.find(i => i.id === this.nearDockIslandId);
      this.ui.show('dock-prompt', `<div class="zone-prompt">Press SPACE to <span style="color:var(--gold);">DOCK</span> at ${island?.name ?? 'island'}</div>`);
    } else if (!this.nearDockIslandId && prevDockId) {
      this.ui.remove('dock-prompt');
    }

    // Check if all enemy captains defeated
    if (!this.allDefeatedShown) {
      const patrols = this.world.getEntitiesWithComponents('ai_patrol');
      const allDefeated = patrols.length > 0 && patrols.every(e => {
        const p = e.getComponent<AIPatrolComponent>('ai_patrol');
        return p.state === 'defeated';
      });
      if (allDefeated) {
        this.allDefeatedShown = true;
        const ship = this.playerEntity.getComponent<ShipComponent>('ship');
        const newMax = Math.min(6, ship.maxPartySize + 1);
        const expanded = newMax > ship.maxPartySize;
        ship.maxPartySize = newMax;

        this.ui.show('all-defeated', `<div style="
          position:absolute; top:20%; left:50%; transform:translateX(-50%);
          background:var(--panel-bg); border:3px solid var(--gold);
          padding:20px 32px; text-align:center; z-index:70;
          box-shadow:6px 6px 0 rgba(0,0,0,0.5); animation:catchPop 0.3s steps(4);
        ">
          <div style="font-family:var(--pixel-font); font-size:14px; color:var(--gold); margin-bottom:12px;">SEAS CONQUERED!</div>
          <div style="font-family:var(--pixel-font); font-size:8px; color:var(--text); line-height:2;">
            All pirate captains defeated!<br>
            ${expanded ? `<span style="color:var(--hp-green);">CREW CAPACITY EXPANDED TO ${newMax}!</span><br>` : ''}
            <span style="color:var(--text-dim);">Pirates will return stronger...</span>
          </div>
        </div>`);
        audio.playSFX('level_up');
        this.pendingTimers.push(setTimeout(() => {
          this.ui.remove('all-defeated');
          for (const entity of patrols) {
            const patrol = entity.getComponent<AIPatrolComponent>('ai_patrol');
            const enemyShip = entity.getComponent<ShipComponent>('ship');
            patrol.state = 'patrol';
            patrol.currentWaypointIndex = 0;
            for (const fish of enemyShip.party) {
              fish.level += 5;
              const species = FISH_SPECIES[fish.speciesId];
              fish.maxHp = calcStat(species.baseStats.hp, fish.iv.hp, fish.level, true);
              fish.currentHp = fish.maxHp;
            }
            if (entity.hasComponent('mesh')) {
              const meshComp = entity.getComponent<MeshComponent>('mesh');
              meshComp.object.visible = true;
            }
          }
          this.allDefeatedShown = false;
        }, 6000));
      }
    }

    // Update HUD
    const ship = this.playerEntity.getComponent<ShipComponent>('ship');
    showHUD(this.ui, ship);

    // Minimap
    const minimapEntities: MinimapEntity[] = [];
    for (const zone of ZONES) {
      minimapEntities.push({
        x: zone.position.x, z: zone.position.z, color: zone.color,
        type: 'zone', radius: zone.radius,
        label: zone.name.split(' ').map(w => w[0]).join(''),
      });
    }
    for (const island of ISLANDS) {
      minimapEntities.push({ x: island.x, z: island.z, color: '#6b8e23', type: 'island' });
    }
    let chasing = false;
    for (const entity of this.world.getEntitiesWithComponents('transform', 'ai_patrol')) {
      const et = entity.getComponent<TransformComponent>('transform');
      const patrol = entity.getComponent<AIPatrolComponent>('ai_patrol');
      if (patrol.state !== 'defeated') {
        minimapEntities.push({ x: et.x, z: et.z, color: patrol.state === 'chase' ? '#ff4040' : '#cc3030', type: 'enemy' });
        if (patrol.state === 'chase') chasing = true;
      }
    }
    updateMinimap(transform.x, transform.z, transform.rotationY, minimapEntities);

    if (chasing) {
      this.ui.show('chase-warn', `<div style="
        position:absolute; top:12px; left:50%; transform:translateX(-50%);
        font-family:var(--pixel-font); font-size:10px; color:var(--hp-red);
        animation:barFlash 0.5s steps(2) infinite; z-index:10; pointer-events:none;
      ">PIRATE APPROACHING!</div>`);
    } else {
      this.ui.remove('chase-warn');
    }

    // Auto-save every 10 seconds
    this.saveTimer += dt;
    if (this.saveTimer > 10) {
      this.saveTimer = 0;
      saveGame({
        party: ship.party,
        playerX: transform.x,
        playerZ: transform.z,
        playerRotation: transform.rotationY,
        maxPartySize: ship.maxPartySize,
        playtime: this.playtime,
        items: ship.items,
        gold: ship.gold,
        baitInventory: ship.baitInventory,
        discoveredTreasures: ship.discoveredTreasures,
      });
    }

    if (this.dockHealCooldown > 0) this.dockHealCooldown -= dt;

    // Passive healing while sailing (2% max HP every 5s)
    this.healTimer += dt;
    if (this.healTimer > 5) {
      this.healTimer = 0;
      for (const fish of ship.party) {
        if (fish.currentHp > 0 && fish.currentHp < fish.maxHp) {
          fish.currentHp = Math.min(fish.maxHp, fish.currentHp + Math.max(1, Math.floor(fish.maxHp * 0.02)));
        }
      }
    }
  }

  private spawnAtmosphereParticle(W: number, H: number): AtmosphereParticle {
    switch (this.nearBiome) {
      case 'volcanic':
        return {
          x: W * 0.1 + Math.random() * W * 0.8,
          y: H * 0.4 + Math.random() * H * 0.5,
          vx: (Math.random() - 0.5) * 25,
          vy: -50 - Math.random() * 80,
          life: 2.0 + Math.random() * 1.0,
          maxLife: 3.0,
          size: 2 + Math.random() * 4,
          color: Math.random() > 0.6 ? 0xFF6600 : Math.random() > 0.3 ? 0xFF3300 : 0xFFAA00,
          alpha: 0.6,
        };
      case 'storm':
        return {
          x: Math.random() * W * 1.2,
          y: -10 - Math.random() * 20,
          vx: -40 - Math.random() * 30, // wind angle
          vy: 250 + Math.random() * 150,
          life: 1.0 + Math.random() * 0.5,
          maxLife: 1.5,
          size: 1 + (Math.random() > 0.7 ? 1 : 0),
          color: 0xCCDDEE,
          alpha: 0.5,
        };
      case 'coral':
        return {
          x: W * 0.1 + Math.random() * W * 0.8,
          y: H * 0.4 + Math.random() * H * 0.5,
          vx: (Math.random() - 0.5) * 12,
          vy: -15 - Math.random() * 25,
          life: 2.5 + Math.random() * 1.5,
          maxLife: 4.0,
          size: 2 + Math.random() * 4,
          color: Math.random() > 0.5 ? 0xFF6B9D : 0xFF9BC4,
          alpha: 0.5,
        };
      case 'abyss':
        return {
          x: Math.random() * W,
          y: H * 0.3 + Math.random() * H * 0.7,
          vx: (Math.random() - 0.5) * 15,
          vy: -12 - Math.random() * 18,
          life: 2.0 + Math.random() * 1.5,
          maxLife: 3.5,
          size: 2 + Math.random() * 3,
          color: Math.random() > 0.5 ? 0x6C3483 : 0x4A235A,
          alpha: 0.5,
        };
      default:
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vx: 0,
          vy: -10,
          life: 1.0,
          maxLife: 1.0,
          size: 2,
          color: 0xffffff,
          alpha: 0.2,
        };
    }
  }

  render(_interpolation: number): void {
    this.pixiCtx.app.renderer.render(this.pixiCtx.app.stage);
  }

  exit(): void {
    hideHUD(this.ui);
    this.ui.remove('zone-prompt');
    this.ui.remove('dock-prompt');
    this.ui.remove('chase-warn');
    this.ui.remove('all-defeated');
    if (this.islandUIOpen) {
      hideIslandUI(this.ui);
      this.islandUIOpen = false;
    }

    for (const fn of this.cleanupFns) fn();
    this.cleanupFns.length = 0;

    this.wakeParticles.length = 0;
    this.atmosphereParticles.length = 0;

    // Clear pending timers to prevent stale callbacks
    for (const t of this.pendingTimers) clearTimeout(t);
    this.pendingTimers.length = 0;

    // Destroy graphics objects
    if (this.wakeGraphics) { this.wakeGraphics.destroy(); }
    if (this.atmosphereGraphics) { this.atmosphereGraphics.destroy(); }
    if (this.seagullGraphics) { this.seagullGraphics.destroy(); }
  }
}
