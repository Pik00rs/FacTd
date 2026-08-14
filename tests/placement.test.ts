import { describe, it, expect } from "vitest";
import { createWorld, place, canPlace, removeAt, buildingAt, type World } from "../src/sim/world";
import { footprint, idx } from "../src/sim/grid";
import { defIndex } from "../src/data/defs";
import { Terrain, WORLD_W, NO_BUILDING } from "../src/sim/constants";

const BELT = defIndex("belt");
const SMELTER = defIndex("smelter");
const MINER = defIndex("miner");

/** Premier emplacement libre où le bâtiment tient, pour ne pas dépendre du relief. */
function findSpot(w: World, type: number, rot = 0): { x: number; y: number } {
  for (let y = 2; y < 120; y++) {
    for (let x = 2; x < 120; x++) {
      if (canPlace(w, type, x, y, rot).ok) return { x, y };
    }
  }
  throw new Error("aucun emplacement trouvé");
}

describe("empreinte au sol", () => {
  it("échange largeur et hauteur sur les rotations est/ouest", () => {
    expect(footprint(1, 3, 0)).toEqual({ w: 1, h: 3 });
    expect(footprint(1, 3, 1)).toEqual({ w: 3, h: 1 });
    expect(footprint(1, 3, 2)).toEqual({ w: 1, h: 3 });
    expect(footprint(1, 3, 3)).toEqual({ w: 3, h: 1 });
  });
});

describe("pose de bâtiment", () => {
  it("marque toutes les cases de l'empreinte", () => {
    const w = createWorld(42);
    const { x, y } = findSpot(w, SMELTER);
    const id = place(w, SMELTER, x, y, 0);

    expect(id).toBeGreaterThanOrEqual(0);
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        expect(buildingAt(w, x + dx, y + dy)).toBe(id);
      }
    }
    expect(w.buildings.count).toBe(1);
  });

  it("refuse un chevauchement et explique pourquoi", () => {
    const w = createWorld(42);
    const { x, y } = findSpot(w, SMELTER);
    place(w, SMELTER, x, y, 0);

    const check = canPlace(w, BELT, x + 1, y + 1, 0);
    expect(check.ok).toBe(false);
    expect(check.reason).toBe("Emplacement occupé");
    expect(place(w, BELT, x + 1, y + 1, 0)).toBe(-1);
  });

  it("refuse une pose hors carte", () => {
    const w = createWorld(42);
    expect(canPlace(w, SMELTER, WORLD_W - 1, 10, 0).reason).toBe("Hors carte");
  });

  it("libère les cases à la destruction et recycle le slot", () => {
    const w = createWorld(42);
    const { x, y } = findSpot(w, SMELTER);
    const id = place(w, SMELTER, x, y, 0);

    // Cliquer sur n'importe quelle case de l'empreinte détruit le bâtiment entier.
    expect(removeAt(w, x + 2, y + 2)).toBe(true);
    expect(w.buildings.count).toBe(0);
    expect(buildingAt(w, x, y)).toBe(NO_BUILDING);

    expect(place(w, SMELTER, x, y, 0)).toBe(id);
  });

  it("ne détruit rien sur une case vide", () => {
    const w = createWorld(42);
    const { x, y } = findSpot(w, BELT);
    expect(removeAt(w, x, y)).toBe(false);
  });
});

describe("contraintes de terrain", () => {
  it("n'autorise l'extracteur que sur un gisement", () => {
    const w = createWorld(7);

    let ore = -1;
    for (let i = 0; i < w.terrain.length - WORLD_W - 1; i++) {
      const isOre = (j: number) =>
        w.terrain[j] === Terrain.IronOre || w.terrain[j] === Terrain.CopperOre;
      if (isOre(i) && isOre(i + 1) && isOre(i + WORLD_W) && isOre(i + WORLD_W + 1)) {
        ore = i;
        break;
      }
    }
    expect(ore).toBeGreaterThan(-1);
    expect(place(w, MINER, ore % WORLD_W, (ore / WORLD_W) | 0, 0)).toBeGreaterThanOrEqual(0);

    let ground = -1;
    for (let y = 2; y < 120; y++) {
      for (let x = 2; x < 120; x++) {
        if (
          w.terrain[idx(x, y)] === Terrain.Ground &&
          w.terrain[idx(x + 1, y)] === Terrain.Ground &&
          w.terrain[idx(x, y + 1)] === Terrain.Ground &&
          w.terrain[idx(x + 1, y + 1)] === Terrain.Ground
        ) {
          ground = idx(x, y);
          break;
        }
      }
      if (ground > -1) break;
    }
    expect(place(w, MINER, ground % WORLD_W, (ground / WORLD_W) | 0, 0)).toBe(-1);
  });

  it("interdit de construire sur l'eau", () => {
    const w = createWorld(3);
    const water = w.terrain.indexOf(Terrain.Water);
    expect(water).toBeGreaterThan(-1);
    const check = canPlace(w, BELT, water % WORLD_W, (water / WORLD_W) | 0, 0);
    expect(check.reason).toBe("Terrain non constructible");
  });
});
