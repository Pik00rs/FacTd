import { DAY_TICKS, NIGHT_START, ASSAULT_EVERY_DAYS } from "./constants";

/**
 * Tout le calendrier se déduit du compteur de ticks. Aucun état stocké,
 * donc rien à sauvegarder et rien à désynchroniser.
 */

export type Phase = "jour" | "nuit";

/** Jour en cours, à partir de 1. */
export function dayOf(tick: number): number {
  return Math.floor(tick / DAY_TICKS) + 1;
}

/** Position dans le cycle, entre 0 (aube) et 1 (fin de nuit). */
export function cycleProgress(tick: number): number {
  return (tick % DAY_TICKS) / DAY_TICKS;
}

export function phaseOf(tick: number): Phase {
  return cycleProgress(tick) >= NIGHT_START ? "nuit" : "jour";
}

/** Vrai les jours où la nuit apporte une vague lourde. */
export function isAssaultDay(day: number): boolean {
  return day % ASSAULT_EVERY_DAYS === 0;
}

/** Ticks restants avant le prochain basculement jour → nuit ou nuit → jour. */
export function ticksUntilPhaseChange(tick: number): number {
  const p = cycleProgress(tick);
  const target = p < NIGHT_START ? NIGHT_START : 1;
  return Math.ceil((target - p) * DAY_TICKS);
}

/**
 * Pression appliquée aux vagues, croissante avec les jours.
 * Volontairement une courbe simple : c'est un levier d'équilibrage, pas un algorithme.
 */
export function threatLevel(tick: number): number {
  const day = dayOf(tick);
  const base = 1 + (day - 1) * 0.35;
  return isAssaultDay(day) && phaseOf(tick) === "nuit" ? base * 3 : base;
}
