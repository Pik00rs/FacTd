/**
 * Constantes de simulation.
 * AUCUNE valeur de rendu ici (pixels, couleurs, tailles d'écran) : voir src/render/constants.ts
 */

export const WORLD_W = 256;
export const WORLD_H = 256;
export const TILE_COUNT = WORLD_W * WORLD_H;

/** Pas fixe de la simulation. Ne jamais lire un deltaTime dans /sim. */
export const TPS = 60;

/** Durée d'un cycle jour+nuit complet, en ticks (7 minutes réelles). */
export const DAY_TICKS = TPS * 60 * 7;

/** Fraction du cycle à partir de laquelle la nuit commence. */
export const NIGHT_START = 0.62;

/** Une vague lourde tombe à la nuit de chaque Nième jour. */
export const ASSAULT_EVERY_DAYS = 7;

/** Plafond dur du nombre de bâtiments simultanés. Dimensionne les TypedArrays. */
export const MAX_BUILDINGS = 65536;

/** Case vide dans la carte d'occupation. */
export const NO_BUILDING = -1;

export const Terrain = {
  Ground: 0,
  Rock: 1,
  IronOre: 2,
  CopperOre: 3,
  Water: 4,
} as const;

export type TerrainId = (typeof Terrain)[keyof typeof Terrain];

/** Terrains sur lesquels on ne peut rien poser. */
export const UNBUILDABLE: readonly number[] = [Terrain.Water];

/** Rotations : 0 = Nord, 1 = Est, 2 = Sud, 3 = Ouest. */
export const DIR_DX = [0, 1, 0, -1] as const;
export const DIR_DY = [-1, 0, 1, 0] as const;
