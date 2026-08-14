/**
 * Aléatoire déterministe.
 *
 * REGLE : `Math.random()` est INTERDIT partout dans /sim.
 * Deux mondes créés avec la même graine doivent produire exactement le même
 * état après N ticks — c'est ce qui rend les sauvegardes et les tests fiables.
 */

export interface RngHolder {
  rngState: number;
}

/** mulberry32 — rapide, sans allocation, état sur un seul entier 32 bits. */
export function nextRandom(holder: RngHolder): number {
  holder.rngState = (holder.rngState + 0x6d2b79f5) | 0;
  let t = holder.rngState >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Entier dans [0, max). */
export function nextInt(holder: RngHolder, max: number): number {
  return (nextRandom(holder) * max) | 0;
}

/**
 * Hash spatial pur : même (seed, x, y) => même valeur, sans état.
 * Sert à la génération de terrain, qui doit être rejouable à l'identique
 * pour que la sauvegarde n'ait qu'à stocker la graine.
 */
export function hash2(seed: number, x: number, y: number): number {
  let h = (seed ^ Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1)) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Bruit de valeur lissé, pour les nappes de minerai. */
export function valueNoise(seed: number, x: number, y: number, scale: number): number {
  const fx = x / scale;
  const fy = y / scale;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);

  const n00 = hash2(seed, x0, y0);
  const n10 = hash2(seed, x0 + 1, y0);
  const n01 = hash2(seed, x0, y0 + 1);
  const n11 = hash2(seed, x0 + 1, y0 + 1);

  const a = n00 + (n10 - n00) * sx;
  const b = n01 + (n11 - n01) * sx;
  return a + (b - a) * sy;
}
