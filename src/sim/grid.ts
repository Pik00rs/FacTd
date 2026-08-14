import { WORLD_W, WORLD_H } from "./constants";

/**
 * La grille est un tableau plat. Toute conversion passe par ici — ne recalcule
 * jamais `y * WORLD_W + x` à la main ailleurs, c'est la première source de bugs.
 */

export function idx(x: number, y: number): number {
  return y * WORLD_W + x;
}

export function tileX(i: number): number {
  return i % WORLD_W;
}

export function tileY(i: number): number {
  return (i / WORLD_W) | 0;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H;
}

/**
 * Empreinte au sol d'un bâtiment une fois tourné.
 * Rotations 1 et 3 (Est / Ouest) échangent largeur et hauteur.
 */
export function footprint(w: number, h: number, rot: number): { w: number; h: number } {
  return rot % 2 === 0 ? { w, h } : { w: h, h: w };
}

/** Distance de Manhattan — la métrique du pathfinding sur grille. */
export function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}
