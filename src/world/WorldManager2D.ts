import { Container, Graphics, Sprite } from 'pixi.js';
import { Entity, World } from '../core/ECS';
import { createTransform } from '../components/TransformComponent';
import { createVelocity } from '../components/VelocityComponent';
import { createMesh } from '../components/MeshComponent';
import { createCollider } from '../components/ColliderComponent';
import { createShip } from '../components/ShipComponent';
import { createAIPatrol } from '../components/AIPatrolComponent';
import { ZONES } from '../data/zone-db';
import { ENEMIES } from '../data/enemy-db';
import { createFishInstance } from '../data/fish-db';
import { PLAYER_SPEED, PLAYER_TURN_RATE, ENEMY_SPEED, ENEMY_TURN_RATE } from '../data/constants';
import { getShipTexture, getIslandTexture } from '../utils/SpriteSheetGenerator';

// Island data for the archipelago
export interface IslandData {
  id: string;
  name: string;
  x: number;
  z: number;
  biome: 'tropical' | 'volcanic' | 'storm' | 'coral' | 'harbor' | 'abyss';
  color: number;
  dockColor: number;
  radius: number;
}

export const ISLANDS: IslandData[] = [
  { id: 'sunlit_cove',     name: 'Sunlit Cove',            x: -600,  z: -450, biome: 'tropical', color: 0xF4C87A, dockColor: 0x8B5E3C, radius: 80 },
  { id: 'coral_atoll',     name: 'Coral Reef Atoll',        x: 900,   z: -600, biome: 'coral',    color: 0xFF6B6B, dockColor: 0x8B5E3C, radius: 70 },
  { id: 'volcanic_isle',   name: 'Volcanic Isle',           x: -600,  z: 500,  biome: 'volcanic', color: 0x3D2B1F, dockColor: 0x5C3A1E, radius: 90 },
  { id: 'storm_reach',     name: 'Storm Reach',             x: 1100,  z: 300,  biome: 'storm',    color: 0x4A5A6A, dockColor: 0x3D4A5A, radius: 75 },
  { id: 'merchants_port',  name: "Merchant's Port",         x: 800,   z: 900,  biome: 'harbor',   color: 0xC4854A, dockColor: 0x8B5E3C, radius: 110 },
  { id: 'dread_fortress',  name: "Dread Corsair's Fortress", x: 1500, z: 1500, biome: 'abyss',    color: 0x1A1A2E, dockColor: 0x2A1A3E, radius: 100 },
];

/** Create player ship as a scaled Sprite from pixel art PNG */
export function createPlayerShipGraphics(): Container {
  const c = new Container();
  const tex = getShipTexture('player');
  const sprite = new Sprite(tex);
  sprite.anchor.set(0.5);
  // PNGs are 512px, canvas fallbacks are 32px — scale to ~64px world size
  const scale = 64 / tex.width;
  sprite.scale.set(scale);
  c.addChild(sprite);
  return c;
}

/** Create enemy ship as a scaled Sprite with skull emblem */
export function createEnemyShipGraphics(hullColor: number): Container {
  const c = new Container();
  // Map hull color to texture key
  let key: 'enemy-red' | 'enemy-purple' | 'enemy-black' = 'enemy-black';
  if (hullColor === 0xDC143C || (hullColor >> 16 & 0xFF) > 0x80) key = 'enemy-red';
  else if (hullColor === 0x4B0082 || ((hullColor >> 8 & 0xFF) < 0x30 && (hullColor & 0xFF) > 0x40)) key = 'enemy-purple';

  const tex = getShipTexture(key);
  const sprite = new Sprite(tex);
  sprite.anchor.set(0.5);
  // PNGs are 512px, canvas fallbacks are 32px — scale to ~70px (slightly larger than player)
  const scale = 70 / tex.width;
  sprite.scale.set(scale);
  c.addChild(sprite);
  return c;
}

/** Draw a fishing zone with layered glowing rings */
export function createZoneGraphics(radius: number, color: string): Container {
  const c = new Container();
  const g = new Graphics();
  const colorNum = parseInt(color.replace('#', ''), 16);

  // Outer faint glow ring (largest, most transparent)
  g.circle(0, 0, radius + 8).stroke({ width: 6, color: colorNum, alpha: 0.15 });
  // Middle glow ring
  g.circle(0, 0, radius).stroke({ width: 4, color: colorNum, alpha: 0.35 });
  // Inner bright ring
  g.circle(0, 0, radius - 12).stroke({ width: 2, color: colorNum, alpha: 0.7 });
  // Innermost thin bright ring
  g.circle(0, 0, radius - 22).stroke({ width: 1, color: colorNum, alpha: 0.9 });
  // Center glow dot
  g.circle(0, 0, 6).fill({ color: colorNum, alpha: 0.5 });
  g.circle(0, 0, 3).fill({ color: 0xffffff, alpha: 0.4 });

  c.addChild(g);
  return c;
}

/** Create island as a scaled Sprite from canvas-drawn pixel art */
export function createIslandGraphics(island: IslandData): Container {
  const c = new Container();
  const sprite = new Sprite(getIslandTexture(island.biome));
  sprite.anchor.set(0.5);
  // Scale proportional to island radius (64px base → island.radius * 2 world size)
  const scale = (island.radius * 2) / 64;
  sprite.scale.set(scale);
  c.addChild(sprite);
  return c;
}

export interface WorldSpawnResult {
  playerEntity: Entity;
  zoneContainers: Container[];
  islandContainers: Container[];
}

export function spawnWorld2D(world: World, worldLayer: Container): WorldSpawnResult {
  // Player ship
  const playerEntity = new Entity();
  const playerGraphics = createPlayerShipGraphics();
  playerEntity
    .addComponent(createTransform(-600, 0, -600))  // Start near Sunlit Cove
    .addComponent(createVelocity(PLAYER_SPEED, PLAYER_TURN_RATE))
    .addComponent(createMesh(playerGraphics))
    .addComponent(createCollider(32, 'player'))
    .addComponent(createShip('Player', true, 3));
  world.addEntity(playerEntity);
  worldLayer.addChild(playerGraphics);
  // Initial position sync
  playerGraphics.x = -600;
  playerGraphics.y = -600;

  // Islands
  const islandContainers: Container[] = [];
  for (const island of ISLANDS) {
    const graphics = createIslandGraphics(island);
    graphics.x = island.x;
    graphics.y = island.z;
    worldLayer.addChildAt(graphics, 0); // Add islands below ships
    islandContainers.push(graphics);

    // Island collision entity
    const islandEntity = new Entity();
    islandEntity
      .addComponent(createTransform(island.x, 0, island.z))
      .addComponent(createCollider(island.radius, 'island'));
    world.addEntity(islandEntity);
  }

  // Fishing zones
  const zoneContainers: Container[] = [];
  for (const zone of ZONES) {
    const graphics = createZoneGraphics(zone.radius, zone.color);
    graphics.x = zone.position.x;
    graphics.y = zone.position.z;
    worldLayer.addChildAt(graphics, 0);
    zoneContainers.push(graphics);

    const zoneEntity = new Entity();
    zoneEntity
      .addComponent(createTransform(zone.position.x, 0, zone.position.z))
      .addComponent(createCollider(zone.radius, 'zone', true));
    world.addEntity(zoneEntity);
  }

  // Enemy ships
  for (const template of ENEMIES) {
    const shipGraphics = createEnemyShipGraphics(template.shipColor ?? 0x1a0e08);
    const startWp = template.patrolWaypoints[0];
    shipGraphics.x = startWp.x;
    shipGraphics.y = startWp.z;

    const enemyEntity = new Entity();
    const shipComp = createShip(template.name, false, 3);
    shipComp.party = template.party.map((p) =>
      createFishInstance(p.speciesId, p.level, p.moves)
    );

    enemyEntity
      .addComponent(createTransform(startWp.x, 0, startWp.z))
      .addComponent(createVelocity(ENEMY_SPEED, ENEMY_TURN_RATE))
      .addComponent(createMesh(shipGraphics))
      .addComponent(createCollider(40, 'enemy'))
      .addComponent(shipComp)
      .addComponent(createAIPatrol(template.patrolWaypoints, template.aggroRadius));
    world.addEntity(enemyEntity);
    worldLayer.addChild(shipGraphics);
  }

  return { playerEntity, zoneContainers, islandContainers };
}

/** Animate zone rings (pulsing glow effect) */
export function updateZoneVisuals(zoneContainers: Container[], elapsed: number): void {
  for (let i = 0; i < zoneContainers.length; i++) {
    const scale = 1.0 + Math.sin(elapsed * 2 + i * 1.2) * 0.06;
    const c = zoneContainers[i];
    c.scale.set(scale);
    c.alpha = 0.7 + Math.sin(elapsed * 2 + i * 1.2) * 0.3;
  }
}
