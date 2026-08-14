/**
 * Constantes de rendu. Rien ici n'a le droit d'être importé par /sim.
 * Le "tile" en pixels n'existe QUE de ce côté : la simulation raisonne en cases.
 */

/** Taille d'une case à zoom 1, en pixels. */
export const TILE_PX = 32;

export const ZOOM_MIN = 6;
export const ZOOM_MAX = 96;
export const ZOOM_STEP = 1.15;

/** Palette : tableau de commande industriel émaillé, lampes ambre. */
export const COLOR = {
  void: 0x0b100f,
  ground: 0x1b2620,
  rock: 0x2b3330,
  ironOre: 0x3e4e5a,
  copperOre: 0x5a4436,
  water: 0x12242b,
  gridLine: 0x16201c,
  ghostOk: 0x7fd1ae,
  ghostBad: 0xe5484d,
  outline: 0x0b100f,
  lamp: 0xffb000,
} as const;

/** Couleur de terrain par identifiant, dans l'ordre de l'enum Terrain. */
export const TERRAIN_COLOR = [
  COLOR.ground,
  COLOR.rock,
  COLOR.ironOre,
  COLOR.copperOre,
  COLOR.water,
] as const;

/** La grille ne se dessine qu'au-delà de ce zoom, sinon elle devient du bruit. */
export const GRID_VISIBLE_ABOVE = 14;

export function hexToInt(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}
