import {
  WORLD_W,
  WORLD_H,
  TILE_COUNT,
  NO_BUILDING,
  Terrain,
  UNBUILDABLE,
} from "./constants";
import { idx, inBounds, footprint } from "./grid";
import { valueNoise } from "./rng";
import { createBuildingStore, allocBuilding, freeBuilding, type BuildingStore } from "./buildings";
import { def } from "../data/defs";

export interface World {
  seed: number;
  /** Nombre de pas de simulation écoulés. C'est la seule horloge du jeu. */
  tick: number;
  /** État du générateur pseudo-aléatoire. Fait partie de la sauvegarde. */
  rngState: number;

  terrain: Uint8Array;
  /** Minerai restant par case. Décroît quand un extracteur pompe. */
  ore: Uint16Array;
  /** Carte d'occupation : id du bâtiment couvrant la case, ou NO_BUILDING. */
  tileBuilding: Int32Array;

  buildings: BuildingStore;
}

export function createWorld(seed: number): World {
  const world: World = {
    seed,
    tick: 0,
    rngState: seed | 0,
    terrain: new Uint8Array(TILE_COUNT),
    ore: new Uint16Array(TILE_COUNT),
    tileBuilding: new Int32Array(TILE_COUNT).fill(NO_BUILDING),
    buildings: createBuildingStore(),
  };
  generateTerrain(world);
  return world;
}

/**
 * Génération purement déterministe à partir de la graine.
 *
 * Conséquence importante : la sauvegarde n'a PAS besoin de stocker le terrain,
 * seulement la graine. Ne jamais introduire ici de dépendance à `nextRandom`,
 * qui consomme un état mutable — uniquement `valueNoise`, qui est pur.
 */
export function generateTerrain(world: World): void {
  const { terrain, ore } = world;
  const s = world.seed;

  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const i = idx(x, y);
      const base = valueNoise(s, x, y, 24);
      const iron = valueNoise(s + 1013, x, y, 14);
      const copper = valueNoise(s + 7919, x, y, 14);
      const water = valueNoise(s + 4241, x, y, 40);

      if (water > 0.78) {
        terrain[i] = Terrain.Water;
      } else if (iron > 0.74) {
        terrain[i] = Terrain.IronOre;
        ore[i] = 400 + ((iron - 0.74) * 4000) | 0;
      } else if (copper > 0.75) {
        terrain[i] = Terrain.CopperOre;
        ore[i] = 400 + ((copper - 0.75) * 4000) | 0;
      } else if (base > 0.66) {
        terrain[i] = Terrain.Rock;
      } else {
        terrain[i] = Terrain.Ground;
      }
    }
  }
}

export interface PlacementCheck {
  ok: boolean;
  /** Motif du refus, affichable tel quel dans l'interface. */
  reason?: string;
}

/**
 * Vérifie une pose sans rien modifier. L'aperçu fantôme et la pose réelle
 * appellent tous les deux cette fonction — pas de règle dupliquée.
 * `x, y` est le coin haut-gauche de l'empreinte.
 */
export function canPlace(
  world: World,
  typeIndex: number,
  x: number,
  y: number,
  rot: number,
): PlacementCheck {
  const d = def(typeIndex);
  const fp = footprint(d.w, d.h, rot);

  for (let dy = 0; dy < fp.h; dy++) {
    for (let dx = 0; dx < fp.w; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      if (!inBounds(tx, ty)) return { ok: false, reason: "Hors carte" };

      const i = idx(tx, ty);
      if (world.tileBuilding[i] !== NO_BUILDING) {
        return { ok: false, reason: "Emplacement occupé" };
      }
      if (UNBUILDABLE.includes(world.terrain[i])) {
        return { ok: false, reason: "Terrain non constructible" };
      }
      if (d.requiresTerrain && !d.requiresTerrain.includes(world.terrain[i])) {
        return { ok: false, reason: `${d.name} : à poser sur un gisement` };
      }
    }
  }
  return { ok: true };
}

/** Pose un bâtiment. Renvoie son id, ou -1 si la pose est refusée. */
export function place(
  world: World,
  typeIndex: number,
  x: number,
  y: number,
  rot: number,
): number {
  if (!canPlace(world, typeIndex, x, y, rot).ok) return -1;

  const id = allocBuilding(world.buildings);
  if (id === NO_BUILDING) return -1;

  const b = world.buildings;
  b.type[id] = typeIndex;
  b.x[id] = x;
  b.y[id] = y;
  b.rot[id] = rot;
  b.health[id] = 100;

  stampFootprint(world, id, true);
  return id;
}

/** Retire le bâtiment couvrant la case (x, y). Renvoie true si quelque chose a été retiré. */
export function removeAt(world: World, x: number, y: number): boolean {
  if (!inBounds(x, y)) return false;
  const id = world.tileBuilding[idx(x, y)];
  if (id === NO_BUILDING) return false;

  stampFootprint(world, id, false);
  freeBuilding(world.buildings, id);
  return true;
}

/** Écrit (ou efface) l'id du bâtiment sur toutes les cases de son empreinte. */
function stampFootprint(world: World, id: number, occupy: boolean): void {
  const b = world.buildings;
  const d = def(b.type[id]);
  const fp = footprint(d.w, d.h, b.rot[id]);
  const value = occupy ? id : NO_BUILDING;

  for (let dy = 0; dy < fp.h; dy++) {
    for (let dx = 0; dx < fp.w; dx++) {
      world.tileBuilding[idx(b.x[id] + dx, b.y[id] + dy)] = value;
    }
  }
}

export function buildingAt(world: World, x: number, y: number): number {
  if (!inBounds(x, y)) return NO_BUILDING;
  return world.tileBuilding[idx(x, y)];
}
