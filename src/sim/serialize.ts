import { createWorld, place, type World } from "./world";

/**
 * La sauvegarde ne stocke PAS le terrain.
 *
 * Le terrain est une fonction pure de la graine, donc le rechargement le
 * régénère à l'identique. Une partie de plusieurs heures tient ainsi dans
 * quelques dizaines de kilo-octets au lieu de plusieurs mégas.
 *
 * Quand les gisements commenceront à s'épuiser (phase 2), il faudra ajouter
 * un delta creux du minerai : `oreDelta: [tileIndex, valeurRestante][]`.
 */

export const SAVE_VERSION = 1;

export interface SavedBuilding {
  t: number;
  x: number;
  y: number;
  r: number;
  hp: number;
}

export interface SaveFile {
  v: number;
  seed: number;
  tick: number;
  rngState: number;
  buildings: SavedBuilding[];
}

export function saveWorld(world: World): SaveFile {
  const b = world.buildings;
  const buildings: SavedBuilding[] = [];

  for (let id = 0; id < b.highWater; id++) {
    if (b.alive[id] === 0) continue;
    buildings.push({ t: b.type[id], x: b.x[id], y: b.y[id], r: b.rot[id], hp: b.health[id] });
  }

  return {
    v: SAVE_VERSION,
    seed: world.seed,
    tick: world.tick,
    rngState: world.rngState,
    buildings,
  };
}

export function loadWorld(save: SaveFile): World {
  if (save.v !== SAVE_VERSION) {
    throw new Error(
      `Sauvegarde en version ${save.v}, le jeu attend la version ${SAVE_VERSION}. Migration à écrire.`,
    );
  }

  const world = createWorld(save.seed);
  for (const s of save.buildings) {
    const id = place(world, s.t, s.x, s.y, s.r);
    if (id >= 0) world.buildings.health[id] = s.hp;
  }
  world.tick = save.tick;
  world.rngState = save.rngState;
  return world;
}
