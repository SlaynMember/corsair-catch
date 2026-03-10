export enum FishType {
  WATER = 'water',
  FIRE = 'fire',
  ELECTRIC = 'electric',
  CORAL = 'coral',
  ABYSSAL = 'abyssal',
  STORM = 'storm',
  NORMAL = 'normal',
}

export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
}

export interface FishSpecies {
  id: string;
  name: string;
  type: FishType;
  baseStats: { hp: number; attack: number; defense: number; speed: number };
  movePool: string[];
  rarity: Rarity;
  color: string;
  description: string;
}

export interface FishInstance {
  uid: string;
  speciesId: string;
  nickname?: string;
  level: number;
  xp: number;
  currentHp: number;
  maxHp: number;
  moves: string[];
  iv: { hp: number; attack: number; defense: number; speed: number };
}

export const FISH_SPECIES: Record<string, FishSpecies> = {
  ember_snapper: {
    id: 'ember_snapper',
    name: 'Ember Snapper',
    type: FishType.FIRE,
    baseStats: { hp: 45, attack: 62, defense: 40, speed: 58 },
    movePool: ['tackle', 'flame_jet', 'scorch', 'ember_bite'],
    rarity: Rarity.COMMON,
    color: '#FF6347',
    description: 'A fiery fish that snaps at anything that moves. Its scales glow like embers.',
  },
  tidecaller: {
    id: 'tidecaller',
    name: 'Tidecaller',
    type: FishType.WATER,
    baseStats: { hp: 55, attack: 45, defense: 60, speed: 42 },
    movePool: ['tackle', 'tidal_wave', 'aqua_shield', 'bubble_burst'],
    rarity: Rarity.COMMON,
    color: '#4682B4',
    description: 'Said to control small tides. Calm but powerful in battle.',
  },
  volt_eel: {
    id: 'volt_eel',
    name: 'Volt Eel',
    type: FishType.ELECTRIC,
    baseStats: { hp: 38, attack: 70, defense: 35, speed: 72 },
    movePool: ['tackle', 'lightning_lash', 'static_shock', 'thunder_fang'],
    rarity: Rarity.UNCOMMON,
    color: '#FFD700',
    description: 'Blindingly fast and shockingly powerful. Handle with extreme care.',
  },
  coral_guardian: {
    id: 'coral_guardian',
    name: 'Coral Guardian',
    type: FishType.CORAL,
    baseStats: { hp: 65, attack: 35, defense: 70, speed: 30 },
    movePool: ['tackle', 'reef_barrier', 'coral_bloom', 'thorn_wrap'],
    rarity: Rarity.UNCOMMON,
    color: '#FF69B4',
    description: 'A living reef creature. Incredibly tough and slowly regenerates.',
  },
  abyssal_fang: {
    id: 'abyssal_fang',
    name: 'Abyssal Fang',
    type: FishType.ABYSSAL,
    baseStats: { hp: 50, attack: 68, defense: 45, speed: 55 },
    movePool: ['tackle', 'shadow_bite', 'void_pulse', 'dread_gaze'],
    rarity: Rarity.RARE,
    color: '#4B0082',
    description: 'Rises from the deepest trenches. Its eyes glow with an unsettling light.',
  },

  // === NEW ELEMENTAL WARRIOR FISH ===

  // Fire
  infernoray: {
    id: 'infernoray',
    name: 'Infernoray',
    type: FishType.FIRE,
    baseStats: { hp: 55, attack: 75, defense: 50, speed: 65 },
    movePool: ['flame_jet', 'scorch', 'inferno_dive', 'ember_bite'],
    rarity: Rarity.UNCOMMON,
    color: '#FF4500',
    description: 'A manta ray with flame-trailing wings and ember eyes. Swoops through thermal vents.',
  },
  blazefin: {
    id: 'blazefin',
    name: 'Blazefin',
    type: FishType.FIRE,
    baseStats: { hp: 42, attack: 82, defense: 38, speed: 70 },
    movePool: ['ember_bite', 'scorch', 'inferno_dive', 'flame_jet'],
    rarity: Rarity.RARE,
    color: '#DC143C',
    description: 'A swordfish with a molten blade nose and magma veins pulsing beneath its scales.',
  },

  // Water
  tsunamaw: {
    id: 'tsunamaw',
    name: 'Tsunamaw',
    type: FishType.WATER,
    baseStats: { hp: 60, attack: 72, defense: 55, speed: 50 },
    movePool: ['tidal_wave', 'aqua_fang', 'bubble_burst', 'aqua_shield'],
    rarity: Rarity.UNCOMMON,
    color: '#1E90FF',
    description: 'A shark with a tidal wave dorsal fin and deep blue armor plating.',
  },
  tidecaster: {
    id: 'tidecaster',
    name: 'Tidecaster',
    type: FishType.WATER,
    baseStats: { hp: 70, attack: 40, defense: 65, speed: 35 },
    movePool: ['bubble_burst', 'aqua_shield', 'tidal_wave', 'whirlpool'],
    rarity: Rarity.COMMON,
    color: '#00CED1',
    description: 'A pufferfish with a water orb shield and current trails. Master of defense.',
  },

  // Electric
  volteel: {
    id: 'volteel',
    name: 'Volteel',
    type: FishType.ELECTRIC,
    baseStats: { hp: 40, attack: 78, defense: 30, speed: 80 },
    movePool: ['lightning_lash', 'thunder_fang', 'static_shock', 'surge_strike'],
    rarity: Rarity.UNCOMMON,
    color: '#FFD700',
    description: 'An electric eel with lightning bolt patterns and sparking arc discharges.',
  },
  shockjaw: {
    id: 'shockjaw',
    name: 'Shockjaw',
    type: FishType.ELECTRIC,
    baseStats: { hp: 45, attack: 85, defense: 40, speed: 60 },
    movePool: ['thunder_fang', 'static_shock', 'lightning_lash', 'surge_strike'],
    rarity: Rarity.RARE,
    color: '#FFA500',
    description: 'A piranha with crackling electric teeth and a static mane of energy.',
  },

  // Coral
  coralline: {
    id: 'coralline',
    name: 'Coralline',
    type: FishType.CORAL,
    baseStats: { hp: 58, attack: 42, defense: 68, speed: 40 },
    movePool: ['coral_bloom', 'thorn_wrap', 'reef_barrier', 'petal_storm'],
    rarity: Rarity.COMMON,
    color: '#FF1493',
    description: 'A seahorse with living coral armor and a reef crown. Elegant yet tough.',
  },
  reefguard: {
    id: 'reefguard',
    name: 'Reefguard',
    type: FishType.CORAL,
    baseStats: { hp: 75, attack: 55, defense: 80, speed: 30 },
    movePool: ['thorn_wrap', 'reef_barrier', 'coral_bloom', 'petal_storm'],
    rarity: Rarity.RARE,
    color: '#C71585',
    description: 'A crab with coral-encrusted shell and anemone fists. An immovable fortress.',
  },

  // Abyssal
  voidfin: {
    id: 'voidfin',
    name: 'Voidfin',
    type: FishType.ABYSSAL,
    baseStats: { hp: 48, attack: 75, defense: 42, speed: 62 },
    movePool: ['void_pulse', 'shadow_bite', 'dread_gaze', 'abyss_drain'],
    rarity: Rarity.UNCOMMON,
    color: '#800080',
    description: 'An anglerfish with a void-light lure and shadow tendrils. Hunts in total darkness.',
  },
  depthwalker: {
    id: 'depthwalker',
    name: 'Depthwalker',
    type: FishType.ABYSSAL,
    baseStats: { hp: 55, attack: 80, defense: 50, speed: 45 },
    movePool: ['shadow_bite', 'void_pulse', 'abyss_drain', 'dread_gaze'],
    rarity: Rarity.RARE,
    color: '#2F0A4F',
    description: 'An octopus with dark matter tentacles and starless eyes. Walks between dimensions.',
  },

  // Storm
  galecutter: {
    id: 'galecutter',
    name: 'Galecutter',
    type: FishType.STORM,
    baseStats: { hp: 42, attack: 60, defense: 38, speed: 82 },
    movePool: ['gale_slash', 'storm_surge', 'static_shock', 'tackle'],
    rarity: Rarity.UNCOMMON,
    color: '#87CEEB',
    description: 'A flying fish with storm-cloud wings and a cyclone tail. Rides the wind.',
  },
  tempestfang: {
    id: 'tempestfang',
    name: 'Tempestfang',
    type: FishType.STORM,
    baseStats: { hp: 50, attack: 78, defense: 45, speed: 70 },
    movePool: ['gale_slash', 'storm_surge', 'thunder_fang', 'tackle'],
    rarity: Rarity.RARE,
    color: '#4682B4',
    description: 'A barracuda with a hurricane jaw and lightning scars. Commander of tempests.',
  },

  // === WATER EXPANSION (9 more for 12 total) ===
  frost_carp: {
    id: 'frost_carp',
    name: 'Frost Carp',
    type: FishType.WATER,
    baseStats: { hp: 52, attack: 38, defense: 55, speed: 38 },
    movePool: ['tackle', 'bubble_burst', 'aqua_shield', 'tidal_wave'],
    rarity: Rarity.COMMON,
    color: '#A8D8EA',
    description: 'A pale silver carp that glides through icy shoals. Its scales repel water.',
  },
  aqua_pike: {
    id: 'aqua_pike',
    name: 'Aqua Pike',
    type: FishType.WATER,
    baseStats: { hp: 44, attack: 58, defense: 40, speed: 64 },
    movePool: ['tackle', 'aqua_fang', 'tidal_wave', 'bubble_burst'],
    rarity: Rarity.COMMON,
    color: '#5BA4CF',
    description: 'A sleek blue pike that darts through currents like a living torpedo.',
  },
  sea_sprite: {
    id: 'sea_sprite',
    name: 'Sea Sprite',
    type: FishType.WATER,
    baseStats: { hp: 48, attack: 42, defense: 50, speed: 55 },
    movePool: ['tackle', 'bubble_burst', 'aqua_shield', 'whirlpool'],
    rarity: Rarity.COMMON,
    color: '#7FDBFF',
    description: 'A small luminous fish that dances through the shallows at dawn.',
  },
  bubble_bass: {
    id: 'bubble_bass',
    name: 'Bubble Bass',
    type: FishType.WATER,
    baseStats: { hp: 60, attack: 35, defense: 62, speed: 30 },
    movePool: ['tackle', 'bubble_burst', 'aqua_shield', 'tidal_wave'],
    rarity: Rarity.COMMON,
    color: '#3BB5D0',
    description: 'A chubby bass that blows protective bubble shields. Slow but resilient.',
  },
  rippleray: {
    id: 'rippleray',
    name: 'Rippleray',
    type: FishType.WATER,
    baseStats: { hp: 58, attack: 55, defense: 52, speed: 58 },
    movePool: ['tidal_wave', 'aqua_fang', 'whirlpool', 'bubble_burst'],
    rarity: Rarity.UNCOMMON,
    color: '#1CBFE8',
    description: 'A manta ray that sends ripple shockwaves across the water surface.',
  },
  tidebreaker: {
    id: 'tidebreaker',
    name: 'Tidebreaker',
    type: FishType.WATER,
    baseStats: { hp: 65, attack: 68, defense: 58, speed: 45 },
    movePool: ['tidal_wave', 'aqua_fang', 'aqua_shield', 'whirlpool'],
    rarity: Rarity.UNCOMMON,
    color: '#0074D9',
    description: 'A hammerhead that can split tidal waves in half with its reinforced skull.',
  },
  crystaleel: {
    id: 'crystaleel',
    name: 'Crystaleel',
    type: FishType.WATER,
    baseStats: { hp: 50, attack: 72, defense: 48, speed: 68 },
    movePool: ['tidal_wave', 'aqua_fang', 'whirlpool', 'bubble_burst'],
    rarity: Rarity.RARE,
    color: '#00B5CC',
    description: 'A transparent eel whose crystalline body refracts light into blinding beams.',
  },
  storm_whale: {
    id: 'storm_whale',
    name: 'Storm Whale',
    type: FishType.WATER,
    baseStats: { hp: 90, attack: 60, defense: 75, speed: 30 },
    movePool: ['tidal_wave', 'aqua_shield', 'whirlpool', 'aqua_fang'],
    rarity: Rarity.RARE,
    color: '#006BA6',
    description: 'An ancient whale that carries storm clouds on its back and sings the tide to shore.',
  },
  tidewyrm: {
    id: 'tidewyrm',
    name: 'The Tidewyrm',
    type: FishType.WATER,
    baseStats: { hp: 100, attack: 85, defense: 80, speed: 55 },
    movePool: ['tidal_wave', 'aqua_fang', 'whirlpool', 'aqua_shield'],
    rarity: Rarity.RARE,
    color: '#002FA7',
    description: 'Legendary sea serpent said to control the ocean currents. Few have seen it and survived.',
  },

  // === FIRE EXPANSION (7 more for 10 total) ===
  lava_carp: {
    id: 'lava_carp',
    name: 'Lava Carp',
    type: FishType.FIRE,
    baseStats: { hp: 48, attack: 55, defense: 45, speed: 50 },
    movePool: ['tackle', 'flame_jet', 'scorch', 'ember_bite'],
    rarity: Rarity.COMMON,
    color: '#FF7043',
    description: 'A red-orange carp that swims near volcanic vents. Its touch burns.',
  },
  flame_pike: {
    id: 'flame_pike',
    name: 'Flame Pike',
    type: FishType.FIRE,
    baseStats: { hp: 42, attack: 65, defense: 35, speed: 62 },
    movePool: ['tackle', 'flame_jet', 'ember_bite', 'scorch'],
    rarity: Rarity.COMMON,
    color: '#FF5722',
    description: 'A pike that leaves a trail of fire when it darts through the water.',
  },
  cinder_ray: {
    id: 'cinder_ray',
    name: 'Cinder Ray',
    type: FishType.FIRE,
    baseStats: { hp: 55, attack: 50, defense: 50, speed: 48 },
    movePool: ['tackle', 'scorch', 'flame_jet', 'inferno_dive'],
    rarity: Rarity.COMMON,
    color: '#E64A19',
    description: 'A stingray whose barb releases burning cinders on impact.',
  },
  magmafin: {
    id: 'magmafin',
    name: 'Magmafin',
    type: FishType.FIRE,
    baseStats: { hp: 58, attack: 70, defense: 55, speed: 52 },
    movePool: ['flame_jet', 'inferno_dive', 'scorch', 'ember_bite'],
    rarity: Rarity.UNCOMMON,
    color: '#BF360C',
    description: 'A fish with magma-filled fins that glow orange-white at full power.',
  },
  scorchscale: {
    id: 'scorchscale',
    name: 'Scorchscale',
    type: FishType.FIRE,
    baseStats: { hp: 50, attack: 78, defense: 42, speed: 65 },
    movePool: ['scorch', 'inferno_dive', 'flame_jet', 'ember_bite'],
    rarity: Rarity.UNCOMMON,
    color: '#D84315',
    description: 'Its scales shed constantly, leaving trails of burning flakes behind it.',
  },
  inferno_bass: {
    id: 'inferno_bass',
    name: 'Inferno Bass',
    type: FishType.FIRE,
    baseStats: { hp: 62, attack: 85, defense: 58, speed: 58 },
    movePool: ['inferno_dive', 'scorch', 'flame_jet', 'ember_bite'],
    rarity: Rarity.RARE,
    color: '#B71C1C',
    description: 'A massive bass that launches itself from volcanic eruptions. Incinerates on contact.',
  },
  lord_of_embers: {
    id: 'lord_of_embers',
    name: 'Lord of Embers',
    type: FishType.FIRE,
    baseStats: { hp: 88, attack: 95, defense: 65, speed: 65 },
    movePool: ['inferno_dive', 'scorch', 'flame_jet', 'ember_bite'],
    rarity: Rarity.RARE,
    color: '#7F0000',
    description: 'Legendary fire wyrm. Said to have ignited the Volcanic Isle itself eons ago.',
  },

  // === ELECTRIC EXPANSION (6 more for 9 total) ===
  spark_minnow: {
    id: 'spark_minnow',
    name: 'Spark Minnow',
    type: FishType.ELECTRIC,
    baseStats: { hp: 35, attack: 52, defense: 28, speed: 75 },
    movePool: ['tackle', 'static_shock', 'lightning_lash', 'surge_strike'],
    rarity: Rarity.COMMON,
    color: '#FFEE58',
    description: 'A tiny minnow that crackles with static electricity. Fast but fragile.',
  },
  zap_fish: {
    id: 'zap_fish',
    name: 'Zap Fish',
    type: FishType.ELECTRIC,
    baseStats: { hp: 40, attack: 58, defense: 32, speed: 68 },
    movePool: ['tackle', 'static_shock', 'lightning_lash', 'thunder_fang'],
    rarity: Rarity.COMMON,
    color: '#FFD600',
    description: 'A fish that zaps anything that comes too close. Its tail doubles as a lightning rod.',
  },
  thunder_ray: {
    id: 'thunder_ray',
    name: 'Thunder Ray',
    type: FishType.ELECTRIC,
    baseStats: { hp: 52, attack: 72, defense: 45, speed: 62 },
    movePool: ['lightning_lash', 'thunder_fang', 'static_shock', 'surge_strike'],
    rarity: Rarity.UNCOMMON,
    color: '#FFC107',
    description: 'A torpedo ray that can discharge enough electricity to stun a whale.',
  },
  bolt_shark: {
    id: 'bolt_shark',
    name: 'Bolt Shark',
    type: FishType.ELECTRIC,
    baseStats: { hp: 60, attack: 80, defense: 50, speed: 70 },
    movePool: ['thunder_fang', 'surge_strike', 'lightning_lash', 'static_shock'],
    rarity: Rarity.UNCOMMON,
    color: '#FF8F00',
    description: 'A shark that accumulates charge while swimming, then releases it in one devastating bite.',
  },
  arc_wyrm: {
    id: 'arc_wyrm',
    name: 'Arc Wyrm',
    type: FishType.ELECTRIC,
    baseStats: { hp: 55, attack: 88, defense: 48, speed: 80 },
    movePool: ['surge_strike', 'thunder_fang', 'lightning_lash', 'static_shock'],
    rarity: Rarity.RARE,
    color: '#E65100',
    description: 'A sea serpent that arcs electricity between its spines in mesmerizing patterns.',
  },
  storm_leviathan: {
    id: 'storm_leviathan',
    name: 'Storm Leviathan',
    type: FishType.ELECTRIC,
    baseStats: { hp: 85, attack: 92, defense: 60, speed: 75 },
    movePool: ['thunder_fang', 'surge_strike', 'lightning_lash', 'static_shock'],
    rarity: Rarity.RARE,
    color: '#BF360C',
    description: 'Legendary electric titan. Every movement sparks lightning across the sky.',
  },

  // === CORAL/NATURE EXPANSION (6 more for 9 total) ===
  sea_moss: {
    id: 'sea_moss',
    name: 'Sea Moss',
    type: FishType.CORAL,
    baseStats: { hp: 55, attack: 30, defense: 60, speed: 28 },
    movePool: ['tackle', 'coral_bloom', 'reef_barrier', 'thorn_wrap'],
    rarity: Rarity.COMMON,
    color: '#26A69A',
    description: 'A jellyfish-like creature draped in living sea moss. Slow but absorbs damage.',
  },
  petal_fin: {
    id: 'petal_fin',
    name: 'Petal Fin',
    type: FishType.CORAL,
    baseStats: { hp: 50, attack: 40, defense: 52, speed: 45 },
    movePool: ['tackle', 'petal_storm', 'coral_bloom', 'reef_barrier'],
    rarity: Rarity.COMMON,
    color: '#F06292',
    description: 'A graceful fish with petal-shaped fins that release healing spores.',
  },
  reef_sprite: {
    id: 'reef_sprite',
    name: 'Reef Sprite',
    type: FishType.CORAL,
    baseStats: { hp: 45, attack: 45, defense: 48, speed: 50 },
    movePool: ['tackle', 'coral_bloom', 'petal_storm', 'thorn_wrap'],
    rarity: Rarity.COMMON,
    color: '#EC407A',
    description: 'A tiny fairy-fish that tends to coral gardens and stings threats with thorns.',
  },
  bloom_ray: {
    id: 'bloom_ray',
    name: 'Bloom Ray',
    type: FishType.CORAL,
    baseStats: { hp: 62, attack: 50, defense: 65, speed: 40 },
    movePool: ['coral_bloom', 'petal_storm', 'reef_barrier', 'thorn_wrap'],
    rarity: Rarity.UNCOMMON,
    color: '#AD1457',
    description: 'A flower-patterned ray that blooms toxic pollen clouds when threatened.',
  },
  coral_titan: {
    id: 'coral_titan',
    name: 'Coral Titan',
    type: FishType.CORAL,
    baseStats: { hp: 80, attack: 60, defense: 88, speed: 22 },
    movePool: ['reef_barrier', 'thorn_wrap', 'coral_bloom', 'petal_storm'],
    rarity: Rarity.UNCOMMON,
    color: '#880E4F',
    description: 'A walking coral fortress. Nearly impossible to break its defense.',
  },
  jade_serpent: {
    id: 'jade_serpent',
    name: 'Jade Serpent',
    type: FishType.CORAL,
    baseStats: { hp: 70, attack: 72, defense: 68, speed: 55 },
    movePool: ['thorn_wrap', 'petal_storm', 'coral_bloom', 'reef_barrier'],
    rarity: Rarity.RARE,
    color: '#1B5E20',
    description: 'A jade-scaled sea serpent with nature energy flowing through its body like sap.',
  },

  // === ABYSSAL EXPANSION (5 more for 8 total) ===
  dark_carp: {
    id: 'dark_carp',
    name: 'Dark Carp',
    type: FishType.ABYSSAL,
    baseStats: { hp: 48, attack: 55, defense: 42, speed: 52 },
    movePool: ['tackle', 'shadow_bite', 'void_pulse', 'dread_gaze'],
    rarity: Rarity.COMMON,
    color: '#4A148C',
    description: 'A carp that absorbed void energy from the deep trenches. Ominous but skittish.',
  },
  shadow_pike: {
    id: 'shadow_pike',
    name: 'Shadow Pike',
    type: FishType.ABYSSAL,
    baseStats: { hp: 45, attack: 70, defense: 38, speed: 68 },
    movePool: ['shadow_bite', 'void_pulse', 'dread_gaze', 'abyss_drain'],
    rarity: Rarity.UNCOMMON,
    color: '#6A1B9A',
    description: 'A predatory pike that phases in and out of shadow, striking from nowhere.',
  },
  void_ray: {
    id: 'void_ray',
    name: 'Void Ray',
    type: FishType.ABYSSAL,
    baseStats: { hp: 55, attack: 75, defense: 50, speed: 58 },
    movePool: ['void_pulse', 'shadow_bite', 'abyss_drain', 'dread_gaze'],
    rarity: Rarity.UNCOMMON,
    color: '#38006B',
    description: 'A manta ray from the abyss whose touch drains life force on contact.',
  },
  abyss_serpent: {
    id: 'abyss_serpent',
    name: 'Abyss Serpent',
    type: FishType.ABYSSAL,
    baseStats: { hp: 65, attack: 82, defense: 58, speed: 52 },
    movePool: ['abyss_drain', 'shadow_bite', 'dread_gaze', 'void_pulse'],
    rarity: Rarity.RARE,
    color: '#1A0033',
    description: 'A massive serpent from the darkest ocean floor. Rarely seen and never forgotten.',
  },
  the_void: {
    id: 'the_void',
    name: 'The Void',
    type: FishType.ABYSSAL,
    baseStats: { hp: 80, attack: 90, defense: 70, speed: 60 },
    movePool: ['void_pulse', 'abyss_drain', 'shadow_bite', 'dread_gaze'],
    rarity: Rarity.RARE,
    color: '#0D0010',
    description: 'An entity of pure void energy. It has no true form — only hunger.',
  },

  // === STORM EXPANSION (6 more for 8 total) ===
  gust_minnow: {
    id: 'gust_minnow',
    name: 'Gust Minnow',
    type: FishType.STORM,
    baseStats: { hp: 36, attack: 48, defense: 30, speed: 78 },
    movePool: ['tackle', 'gale_slash', 'storm_surge', 'static_shock'],
    rarity: Rarity.COMMON,
    color: '#90A4AE',
    description: 'A tiny fish that rides storm winds above the waves. Faster than the eye can follow.',
  },
  wind_carp: {
    id: 'wind_carp',
    name: 'Wind Carp',
    type: FishType.STORM,
    baseStats: { hp: 44, attack: 55, defense: 38, speed: 72 },
    movePool: ['tackle', 'gale_slash', 'storm_surge', 'thunder_fang'],
    rarity: Rarity.COMMON,
    color: '#78909C',
    description: 'A carp that leaps between ocean swells with wind-assisted jumps.',
  },
  cyclone_ray: {
    id: 'cyclone_ray',
    name: 'Cyclone Ray',
    type: FishType.STORM,
    baseStats: { hp: 55, attack: 65, defense: 48, speed: 68 },
    movePool: ['gale_slash', 'storm_surge', 'thunder_fang', 'static_shock'],
    rarity: Rarity.UNCOMMON,
    color: '#546E7A',
    description: 'A ray that spins like a cyclone, generating localized storms wherever it goes.',
  },
  storm_pike: {
    id: 'storm_pike',
    name: 'Storm Pike',
    type: FishType.STORM,
    baseStats: { hp: 48, attack: 72, defense: 42, speed: 76 },
    movePool: ['storm_surge', 'gale_slash', 'thunder_fang', 'static_shock'],
    rarity: Rarity.UNCOMMON,
    color: '#37474F',
    description: 'A pike that charges through storm cells, absorbing lightning into its body.',
  },
  hurricane_bass: {
    id: 'hurricane_bass',
    name: 'Hurricane Bass',
    type: FishType.STORM,
    baseStats: { hp: 60, attack: 80, defense: 52, speed: 72 },
    movePool: ['storm_surge', 'gale_slash', 'thunder_fang', 'static_shock'],
    rarity: Rarity.RARE,
    color: '#263238',
    description: 'A bass that can generate category-5 gales just by flapping its massive fins.',
  },
  the_maelstrom: {
    id: 'the_maelstrom',
    name: 'The Maelstrom',
    type: FishType.STORM,
    baseStats: { hp: 82, attack: 88, defense: 65, speed: 78 },
    movePool: ['storm_surge', 'gale_slash', 'thunder_fang', 'static_shock'],
    rarity: Rarity.RARE,
    color: '#101820',
    description: 'A legendary storm entity that manifests as a spinning mass of wind and lightning.',
  },

  // === NORMAL TYPE (6 new) ===
  sea_bream: {
    id: 'sea_bream',
    name: 'Sea Bream',
    type: FishType.NORMAL,
    baseStats: { hp: 50, attack: 45, defense: 45, speed: 48 },
    movePool: ['tackle', 'aqua_shield', 'bubble_burst', 'gale_slash'],
    rarity: Rarity.COMMON,
    color: '#D4AC0D',
    description: 'A common silver bream found throughout the archipelago. Balanced and reliable.',
  },
  coral_carp: {
    id: 'coral_carp',
    name: 'Coral Carp',
    type: FishType.NORMAL,
    baseStats: { hp: 55, attack: 40, defense: 52, speed: 42 },
    movePool: ['tackle', 'bubble_burst', 'reef_barrier', 'aqua_shield'],
    rarity: Rarity.COMMON,
    color: '#C4A35A',
    description: 'A spotted carp with faint coral patterns on its flanks. Found near every island.',
  },
  harbor_fish: {
    id: 'harbor_fish',
    name: 'Harbor Fish',
    type: FishType.NORMAL,
    baseStats: { hp: 60, attack: 38, defense: 55, speed: 35 },
    movePool: ['tackle', 'aqua_shield', 'bubble_burst', 'tidal_wave'],
    rarity: Rarity.COMMON,
    color: '#B8960C',
    description: 'A stout fish that congregates near docks and merchant ships. Friendly but firm.',
  },
  driftfin: {
    id: 'driftfin',
    name: 'Driftfin',
    type: FishType.NORMAL,
    baseStats: { hp: 45, attack: 50, defense: 40, speed: 58 },
    movePool: ['tackle', 'gale_slash', 'bubble_burst', 'static_shock'],
    rarity: Rarity.COMMON,
    color: '#9E8A2C',
    description: 'A small golden fish that drifts with ocean currents. Adaptable to any water.',
  },
  old_barnacle: {
    id: 'old_barnacle',
    name: 'Old Barnacle',
    type: FishType.NORMAL,
    baseStats: { hp: 72, attack: 55, defense: 70, speed: 25 },
    movePool: ['tackle', 'reef_barrier', 'aqua_shield', 'thorn_wrap'],
    rarity: Rarity.UNCOMMON,
    color: '#7D6608',
    description: 'An ancient barnacle-encrusted fish said to be older than any captain on the seas.',
  },
  ancient_mariner: {
    id: 'ancient_mariner',
    name: 'Ancient Mariner',
    type: FishType.NORMAL,
    baseStats: { hp: 85, attack: 65, defense: 72, speed: 38 },
    movePool: ['tackle', 'tidal_wave', 'gale_slash', 'aqua_shield'],
    rarity: Rarity.RARE,
    color: '#5D4E1E',
    description: 'A massive golden fish carrying generations of wisdom in its eyes. Commands respect.',
  },
};

let uidCounter = 0;

export function createFishInstance(
  speciesId: string,
  level: number,
  moves?: string[]
): FishInstance {
  const species = FISH_SPECIES[speciesId];
  if (!species) throw new Error(`Unknown species: ${speciesId}`);

  const iv = {
    hp: Math.floor(Math.random() * 16),
    attack: Math.floor(Math.random() * 16),
    defense: Math.floor(Math.random() * 16),
    speed: Math.floor(Math.random() * 16),
  };

  const maxHp = calcStat(species.baseStats.hp, iv.hp, level, true);

  // Higher level fish know more moves (2 at low level, up to 4 at higher levels)
  const moveCount = moves ? moves.length : Math.min(species.movePool.length, level >= 10 ? 4 : level >= 5 ? 3 : 2);
  const selectedMoves =
    moves ?? species.movePool.slice(0, moveCount);

  return {
    uid: `fish_${++uidCounter}_${Date.now()}`,
    speciesId,
    level,
    xp: 0,
    currentHp: maxHp,
    maxHp,
    moves: selectedMoves,
    iv,
  };
}

export function calcStat(
  base: number,
  iv: number,
  level: number,
  isHp = false
): number {
  const core = Math.floor(((2 * base + iv) * level) / 100);
  return isHp ? core + level + 10 : core + 5;
}

export function getXpForLevel(level: number): number {
  return Math.floor(level * level * level * 0.8);
}

export function getStatAtLevel(
  species: FishSpecies,
  iv: FishInstance['iv'],
  level: number
): { hp: number; attack: number; defense: number; speed: number } {
  return {
    hp: calcStat(species.baseStats.hp, iv.hp, level, true),
    attack: calcStat(species.baseStats.attack, iv.attack, level),
    defense: calcStat(species.baseStats.defense, iv.defense, level),
    speed: calcStat(species.baseStats.speed, iv.speed, level),
  };
}
