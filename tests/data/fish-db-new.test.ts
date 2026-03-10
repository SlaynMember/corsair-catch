import { describe, it, expect } from "vitest";
import { FISH_SPECIES } from "../../src/data/fish-db";

describe("Fish Database - New System", () => {
  it("should have exactly 60 fish species", () => {
    expect(FISH_SPECIES.length).toBe(60);
  });

  it("each fish should have required fields", () => {
    FISH_SPECIES.forEach((fish) => {
      expect(fish.id).toBeDefined();
      expect(fish.name).toBeDefined();
      expect(fish.type).toBeDefined();
      expect(fish.tier).toBeDefined();
      expect(fish.baseStats).toBeDefined();
      expect(fish.baseStats.hp).toBeGreaterThanOrEqual(50);
      expect(fish.baseStats.hp).toBeLessThanOrEqual(100);
      expect(fish.baseStats.atk).toBeGreaterThanOrEqual(50);
      expect(fish.baseStats.atk).toBeLessThanOrEqual(100);
      expect(fish.baseStats.def).toBeGreaterThanOrEqual(50);
      expect(fish.baseStats.def).toBeLessThanOrEqual(100);
      expect(fish.baseStats.spd).toBeGreaterThanOrEqual(50);
      expect(fish.baseStats.spd).toBeLessThanOrEqual(100);
      expect(fish.moves).toBeDefined();
      expect(Array.isArray(fish.moves)).toBe(true);
    });
  });

  it("Tier 1 fish should know 2 moves", () => {
    const tier1Fish = FISH_SPECIES.filter((f) => f.tier === 1);
    tier1Fish.forEach((fish) => {
      expect(fish.moves.length).toBe(2);
    });
  });

  it("Tier 2 fish should know 3 moves", () => {
    const tier2Fish = FISH_SPECIES.filter((f) => f.tier === 2);
    tier2Fish.forEach((fish) => {
      expect(fish.moves.length).toBe(3);
    });
  });

  it("Tier 3 fish should know 4 moves", () => {
    const tier3Fish = FISH_SPECIES.filter((f) => f.tier === 3);
    tier3Fish.forEach((fish) => {
      expect(fish.moves.length).toBe(4);
    });
  });

  it("should have evolution chain references", () => {
    FISH_SPECIES.forEach((fish) => {
      if (fish.tier < 3) {
        expect(fish.evolvesInto).toBeDefined();
        expect(typeof fish.evolvesInto).toBe("number");
      }
    });
  });

  it("Tier 1 Ember Snapper should have correct stats", () => {
    const emberSnapper = FISH_SPECIES.find(
      (f) => f.name === "Ember Snapper"
    );
    expect(emberSnapper).toBeDefined();
    expect(emberSnapper!.tier).toBe(1);
    expect(emberSnapper!.type).toBe("Fire");
    expect(emberSnapper!.baseStats.hp).toBe(55);
    expect(emberSnapper!.baseStats.atk).toBe(65);
    expect(emberSnapper!.baseStats.def).toBe(50);
    expect(emberSnapper!.baseStats.spd).toBe(58);
  });

  it("Tier 3 Grand Infernoray should have correct stats", () => {
    const grandInfernoray = FISH_SPECIES.find(
      (f) => f.name === "Grand Infernoray"
    );
    expect(grandInfernoray).toBeDefined();
    expect(grandInfernoray!.tier).toBe(3);
    expect(grandInfernoray!.type).toBe("Fire");
    expect(grandInfernoray!.baseStats.hp).toBe(85);
    expect(grandInfernoray!.baseStats.atk).toBe(98);
    expect(grandInfernoray!.baseStats.def).toBe(75);
    expect(grandInfernoray!.baseStats.spd).toBe(85);
  });

  it("should have all 7 types represented", () => {
    const types = new Set(FISH_SPECIES.map((f) => f.type));
    const expectedTypes = ["Fire", "Water", "Electric", "Nature", "Abyssal", "Storm", "Normal"];
    expectedTypes.forEach((type) => {
      expect(types.has(type)).toBe(true);
    });
  });
});
