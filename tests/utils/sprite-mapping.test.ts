import { describe, it, expect } from 'vitest';
import { SPRITE_LOCATIONS, SpriteLocation } from '../../src/utils/SpriteExtractor';

describe('Sprite Location Mapping', () => {
  it('should have exactly 60 fish entries', () => {
    expect(SPRITE_LOCATIONS).toHaveLength(60);
  });

  it('should have all required fields for each sprite location', () => {
    SPRITE_LOCATIONS.forEach((sprite) => {
      expect(sprite).toHaveProperty('gridFile');
      expect(sprite).toHaveProperty('row');
      expect(sprite).toHaveProperty('col');
      expect(sprite).toHaveProperty('fishName');
      expect(sprite).toHaveProperty('type');
    });
  });

  it('should only use valid grid files (1.png, 2.png, 3.png)', () => {
    const validFiles = ['1.png', '2.png', '3.png'];
    SPRITE_LOCATIONS.forEach((sprite) => {
      expect(validFiles).toContain(sprite.gridFile);
    });
  });

  it('should have rows between 1 and 5', () => {
    SPRITE_LOCATIONS.forEach((sprite) => {
      expect(sprite.row).toBeGreaterThanOrEqual(1);
      expect(sprite.row).toBeLessThanOrEqual(5);
      expect(Number.isInteger(sprite.row)).toBe(true);
    });
  });

  it('should have columns between 1 and 4', () => {
    SPRITE_LOCATIONS.forEach((sprite) => {
      expect(sprite.col).toBeGreaterThanOrEqual(1);
      expect(sprite.col).toBeLessThanOrEqual(4);
      expect(Number.isInteger(sprite.col)).toBe(true);
    });
  });

  it('should have valid fish types', () => {
    const validTypes = ['Fire', 'Water', 'Electric', 'Nature', 'Abyssal', 'Storm', 'Normal'];
    SPRITE_LOCATIONS.forEach((sprite) => {
      expect(validTypes).toContain(sprite.type);
    });
  });

  it('should have non-empty fish names', () => {
    SPRITE_LOCATIONS.forEach((sprite) => {
      expect(sprite.fishName).toBeTruthy();
      expect(sprite.fishName.length).toBeGreaterThan(0);
    });
  });

  it('should have correct distribution of types', () => {
    const typeCounts: Record<string, number> = {};
    SPRITE_LOCATIONS.forEach((sprite) => {
      typeCounts[sprite.type] = (typeCounts[sprite.type] || 0) + 1;
    });

    expect(typeCounts['Fire']).toBe(9);
    expect(typeCounts['Water']).toBe(9);
    expect(typeCounts['Electric']).toBe(9);
    expect(typeCounts['Nature']).toBe(9);
    expect(typeCounts['Abyssal']).toBe(9);
    expect(typeCounts['Storm']).toBe(9);
    expect(typeCounts['Normal']).toBe(6);
  });

  it('should have 3 tiers for all major types', () => {
    const typesByTier: Record<string, Record<number, number>> = {};

    SPRITE_LOCATIONS.forEach((sprite) => {
      if (!typesByTier[sprite.type]) {
        typesByTier[sprite.type] = {};
      }

      let tier = 1;
      if (sprite.gridFile === '2.png') tier = 2;
      if (sprite.gridFile === '3.png') tier = 3;

      typesByTier[sprite.type][tier] = (typesByTier[sprite.type][tier] || 0) + 1;
    });

    // Fire, Water, Electric, Nature, Abyssal should have 3 tiers of 3 each
    ['Fire', 'Water', 'Electric', 'Nature', 'Abyssal'].forEach((type) => {
      expect(typesByTier[type][1]).toBe(3);
      expect(typesByTier[type][2]).toBe(3);
      expect(typesByTier[type][3]).toBe(3);
    });

    // Storm has a unique distribution (not standard 3x3)
    expect(typesByTier['Storm'][1]).toBe(3);
    expect(typesByTier['Storm'][2]).toBe(3);
    expect(typesByTier['Storm'][3]).toBe(3);
  });

  it('should distribute Normal type across tiers', () => {
    const normalFish = SPRITE_LOCATIONS.filter((sprite) => sprite.type === 'Normal');

    const tier1 = normalFish.filter((f) => f.gridFile === '1.png');
    const tier2 = normalFish.filter((f) => f.gridFile === '2.png');
    const tier3 = normalFish.filter((f) => f.gridFile === '3.png');

    expect(tier1.length).toBe(2);
    expect(tier2.length).toBe(2);
    expect(tier3.length).toBe(2);
  });

  it('should not have duplicate fish names', () => {
    const names = SPRITE_LOCATIONS.map((s) => s.fishName);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(60);
  });

  it('should have correct Fire type progression', () => {
    const fireTypes = SPRITE_LOCATIONS.filter((s) => s.type === 'Fire');

    const tier1Names = fireTypes.filter((f) => f.gridFile === '1.png').map((f) => f.fishName);
    const tier2Names = fireTypes.filter((f) => f.gridFile === '2.png').map((f) => f.fishName);
    const tier3Names = fireTypes.filter((f) => f.gridFile === '3.png').map((f) => f.fishName);

    expect(tier1Names).toContain('Ember Snapper');
    expect(tier1Names).toContain('Lava Carp');
    expect(tier1Names).toContain('Flame Pike');

    expect(tier2Names).toContain('Blazefin');
    expect(tier2Names).toContain('Magmafin');
    expect(tier2Names).toContain('Scorchscale');

    expect(tier3Names).toContain('Grand Infernoray');
    expect(tier3Names).toContain('Ancient Inferno Bass');
    expect(tier3Names).toContain('Lord of Embers');
  });

  it('should have Abyssal legendary at specific grid position', () => {
    const voidEternal = SPRITE_LOCATIONS.find((s) => s.fishName === 'Void The Eternal');
    expect(voidEternal).toBeDefined();
    expect(voidEternal?.gridFile).toBe('3.png');
    expect(voidEternal?.row).toBe(5);
    expect(voidEternal?.col).toBe(3);
    expect(voidEternal?.type).toBe('Abyssal');
  });

  it('should have unique grid position combinations', () => {
    const positions = SPRITE_LOCATIONS.map((s) => `${s.gridFile}-${s.row}-${s.col}`);
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(60);
  });

  it('should conform to SpriteLocation interface', () => {
    SPRITE_LOCATIONS.forEach((sprite) => {
      const validated: SpriteLocation = {
        gridFile: sprite.gridFile,
        row: sprite.row,
        col: sprite.col,
        fishName: sprite.fishName,
        type: sprite.type,
      };
      expect(validated.gridFile).toBeDefined();
      expect(validated.row).toBeDefined();
      expect(validated.col).toBeDefined();
      expect(validated.fishName).toBeDefined();
      expect(validated.type).toBeDefined();
    });
  });
});
