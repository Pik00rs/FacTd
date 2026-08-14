import { describe, it, expect } from "vitest";
import { createWorld, place, canPlace, type World } from "../src/sim/world";
import { stepWorldBy } from "../src/sim/tick";
import { saveWorld, loadWorld, SAVE_VERSION } from "../src/sim/serialize";
import { defIndex } from "../src/data/defs";

const BELT = defIndex("belt");
const CHEST = defIndex("chest");

function fill(w: World, n: number): void {
  let placed = 0;
  for (let y = 2; y < 120 && placed < n; y++) {
    for (let x = 2; x < 120 && placed < n; x++) {
      if (canPlace(w, BELT, x, y, (x + y) % 4).ok) {
        place(w, BELT, x, y, (x + y) % 4);
        placed++;
      }
    }
  }
}

describe("sauvegarde", () => {
  it("restitue un monde identique", () => {
    const a = createWorld(555);
    fill(a, 300);
    stepWorldBy(a, 5000);

    const b = loadWorld(JSON.parse(JSON.stringify(saveWorld(a))));

    expect(b.tick).toBe(a.tick);
    expect(b.rngState).toBe(a.rngState);
    expect(b.terrain).toEqual(a.terrain);
    expect(b.tileBuilding).toEqual(a.tileBuilding);
    expect(b.buildings.count).toBe(a.buildings.count);
  });

  it("conserve rotation et points de vie", () => {
    const a = createWorld(99);
    const id = place(a, CHEST, 10, 10, 0);
    a.buildings.health[id] = 42;

    const b = loadWorld(saveWorld(a));
    expect(b.buildings.health[0]).toBe(42);
    expect(b.buildings.rot[0]).toBe(0);
  });

  it("ne stocke pas le terrain : la sauvegarde reste petite", () => {
    const a = createWorld(1);
    fill(a, 1000);
    const bytes = JSON.stringify(saveWorld(a)).length;
    // 65 536 cases de terrain en JSON feraient plusieurs centaines de Ko.
    expect(bytes).toBeLessThan(80_000);
  });

  it("refuse une sauvegarde d'une autre version", () => {
    const save = saveWorld(createWorld(1));
    expect(() => loadWorld({ ...save, v: SAVE_VERSION + 1 })).toThrow(/version/i);
  });
});
