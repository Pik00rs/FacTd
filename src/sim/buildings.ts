import { MAX_BUILDINGS } from "./constants";

/**
 * Stockage en "structure de tableaux" (SoA) plutôt qu'en tableau d'objets.
 *
 * Pourquoi : un tableau de 50 000 objets JS, c'est 50 000 allocations, un GC qui
 * hoquette, et des accès mémoire dispersés. Des TypedArrays parallèles restent
 * contigus en mémoire et se parcourent à vitesse quasi native.
 *
 * Un bâtiment est identifié par son index (un `id: number`), jamais par une
 * référence. Les slots libérés sont recyclés via une free-list.
 */
export interface BuildingStore {
  type: Uint8Array;
  x: Uint16Array;
  y: Uint16Array;
  rot: Uint8Array;
  /** Avancement du craft en cours, en ticks. Inutilisé en phase 1. */
  progress: Uint16Array;
  health: Uint16Array;
  alive: Uint8Array;
  /** Plus haut index jamais alloué. Les boucles s'arrêtent ici, pas à MAX_BUILDINGS. */
  highWater: number;
  /** Slots recyclables, en pile. */
  free: number[];
  count: number;
}

export function createBuildingStore(): BuildingStore {
  return {
    type: new Uint8Array(MAX_BUILDINGS),
    x: new Uint16Array(MAX_BUILDINGS),
    y: new Uint16Array(MAX_BUILDINGS),
    rot: new Uint8Array(MAX_BUILDINGS),
    progress: new Uint16Array(MAX_BUILDINGS),
    health: new Uint16Array(MAX_BUILDINGS),
    alive: new Uint8Array(MAX_BUILDINGS),
    highWater: 0,
    free: [],
    count: 0,
  };
}

/** Réserve un slot. Renvoie -1 si le plafond est atteint. */
export function allocBuilding(s: BuildingStore): number {
  let id: number;
  if (s.free.length > 0) {
    id = s.free.pop()!;
  } else {
    if (s.highWater >= MAX_BUILDINGS) return -1;
    id = s.highWater++;
  }
  s.alive[id] = 1;
  s.progress[id] = 0;
  s.count++;
  return id;
}

export function freeBuilding(s: BuildingStore, id: number): void {
  if (s.alive[id] === 0) return;
  s.alive[id] = 0;
  s.free.push(id);
  s.count--;
}
