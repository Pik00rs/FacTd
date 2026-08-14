import type { World } from "./world";

/**
 * Le battement de coeur du jeu.
 *
 * Contrat, à ne jamais casser :
 *  - un tick ne prend AUCUN paramètre de temps, c'est un pas fixe ;
 *  - aucune allocation dans cette fonction ni dans ce qu'elle appelle
 *    (pas de `.map`, `.filter`, littéral d'objet, closure) — le GC est
 *    l'ennemi numéro un d'une boucle à 60 Hz ;
 *  - aucun accès au rendu, au DOM, à `performance.now()` ou à `Math.random()`.
 *
 * Tant que ces trois règles tiennent, la simulation est testable en headless
 * et rejouable à l'identique.
 */
export function stepWorld(world: World): void {
  world.tick++;

  // Phase 2 — stepBelts(world);
  // Phase 2 — stepMachines(world);
  // Phase 4 — stepCombat(world);
  // Phase 5 — stepWaves(world);
}

/** Avance de n ticks d'un coup. Pratique dans les tests et pour rattraper le retard. */
export function stepWorldBy(world: World, n: number): void {
  for (let i = 0; i < n; i++) stepWorld(world);
}
