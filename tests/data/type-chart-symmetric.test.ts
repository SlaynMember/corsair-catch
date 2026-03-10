import { describe, it, expect } from "vitest";
import { TYPE_CHART } from "../../src/data/type-chart";

describe("Type Effectiveness Chart - Symmetric", () => {
  const types = ["Fire", "Water", "Electric", "Nature", "Abyssal", "Storm", "Normal"];

  it("should have entries for all 7 types", () => {
    types.forEach((type) => {
      expect(TYPE_CHART[type]).toBeDefined();
    });
  });

  it("each type should beat exactly 2 other types", () => {
    types.forEach((type) => {
      const beatsCount = TYPE_CHART[type].beats.length;
      expect(beatsCount).toBe(2);
    });
  });

  it("each type should lose to exactly 2 other types", () => {
    types.forEach((type) => {
      const losesCount = TYPE_CHART[type].losesTo.length;
      expect(losesCount).toBe(2);
    });
  });

  it("Fire should beat Nature and Normal", () => {
    expect(TYPE_CHART["Fire"].beats).toContain("Nature");
    expect(TYPE_CHART["Fire"].beats).toContain("Normal");
  });

  it("Fire should lose to Water and Electric", () => {
    expect(TYPE_CHART["Fire"].losesTo).toContain("Water");
    expect(TYPE_CHART["Fire"].losesTo).toContain("Electric");
  });

  it("Water should beat Fire and Electric", () => {
    expect(TYPE_CHART["Water"].beats).toContain("Fire");
    expect(TYPE_CHART["Water"].beats).toContain("Electric");
  });

  it("Electric should beat Water and Storm", () => {
    expect(TYPE_CHART["Electric"].beats).toContain("Water");
    expect(TYPE_CHART["Electric"].beats).toContain("Storm");
  });

  it("Nature should beat Water and Abyssal", () => {
    expect(TYPE_CHART["Nature"].beats).toContain("Water");
    expect(TYPE_CHART["Nature"].beats).toContain("Abyssal");
  });

  it("Abyssal should beat Storm and Normal", () => {
    expect(TYPE_CHART["Abyssal"].beats).toContain("Storm");
    expect(TYPE_CHART["Abyssal"].beats).toContain("Normal");
  });

  it("Storm should beat Normal and Electric", () => {
    expect(TYPE_CHART["Storm"].beats).toContain("Normal");
    expect(TYPE_CHART["Storm"].beats).toContain("Electric");
  });

  it("Normal should beat Electric and Abyssal", () => {
    expect(TYPE_CHART["Normal"].beats).toContain("Electric");
    expect(TYPE_CHART["Normal"].beats).toContain("Abyssal");
  });
});
