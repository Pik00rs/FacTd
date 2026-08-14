import { describe, it, expect } from "vitest";
import { createWorld } from "../src/sim/world";
import { stepWorldBy } from "../src/sim/tick";
import { Terrain, TILE_COUNT } from "../src/sim/constants";

describe("génération du monde", () => {
  it("est déterministe : même graine, même terrain", () => {
    const a = createWorld(1234);
    const b = createWorld(1234);
    expect(a.terrain).toEqual(b.terrain);
    expect(a.ore).toEqual(b.ore);
  });

  it("produit des cartes différentes pour des graines différentes", () => {
    expect(createWorld(1).terrain).not.toEqual(createWorld(2).terrain);
  });

  it("place assez de minerai pour qu'une partie soit jouable", () => {
    const w = createWorld(777);
    let iron = 0;
    let copper = 0;
    for (let i = 0; i < TILE_COUNT; i++) {
      if (w.terrain[i] === Terrain.IronOre) iron++;
      if (w.terrain[i] === Terrain.CopperOre) copper++;
    }
    // Garde-fou d'équilibrage : si un réglage de bruit fait tomber ces nombres,
    // le test le signale avant qu'on s'en aperçoive en jouant.
    expect(iron).toBeGreaterThan(1000);
    expect(copper).toBeGreaterThan(500);
  });
});

describe("boucle de simulation", () => {
  it("avance d'un tick à la fois", () => {
    const w = createWorld(5);
    stepWorldBy(w, 120);
    expect(w.tick).toBe(120);
  });

  it("reste identique entre deux exécutions de même graine", () => {
    const a = createWorld(31337);
    const b = createWorld(31337);
    stepWorldBy(a, 10_000);
    stepWorldBy(b, 10_000);
    expect(a.tick).toBe(b.tick);
    expect(a.rngState).toBe(b.rngState);
    expect(a.tileBuilding).toEqual(b.tileBuilding);
  });
});
