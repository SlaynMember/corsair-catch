// World bounds — 4000x4000 world, -2000 to +2000 in x and z
export const WORLD_SIZE = 2000; // Half-extent
export const WORLD_BOUNDARY = WORLD_SIZE - 50;

// Ship speeds (world units per second)
export const PLAYER_SPEED = 200;
export const PLAYER_TURN_RATE = 2.5;
export const ENEMY_SPEED = 120;
export const ENEMY_TURN_RATE = 1.8;

// Camera
export const CAMERA_DISTANCE = 25;
export const CAMERA_ELEVATION_DEG = 35;
export const CAMERA_SMOOTH_SPEED = 5.0;

// Fishing
export const CAST_POWER_SPEED = 2.0;
export const WAIT_TIME_MIN = 1.5;
export const WAIT_TIME_MAX = 5.0;
export const TENSION_RISE_RATE = 0.25;
export const TENSION_DROP_PER_REEL = 0.15;
export const FISH_HP_DAMAGE_MIN = 0.08;
export const FISH_HP_DAMAGE_MAX = 0.15;
export const MAX_TENSION = 1.0;
export const BITE_WINDOW = 3.0;
export const REEL_COOLDOWN = 0.10;

// Battle
export const STAB_BONUS = 1.5;
export const DAMAGE_RANDOM_MIN = 0.85;
export const DAMAGE_RANDOM_MAX = 1.0;
export const XP_BASE_YIELD = 50;
export const BURN_DAMAGE_FRACTION = 0.0625;
export const PARALYZE_SKIP_CHANCE = 0.25;

// Level
export const MAX_LEVEL = 50;
