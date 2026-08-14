import raw from "./buildings.json";

export interface BuildingDef {
  id: string;
  name: string;
  category: "production" | "logistique" | "defense";
  w: number;
  h: number;
  rotatable: boolean;
  /** Couleur de substitution. Sera remplacée par un atlas de sprites en phase 6. */
  tint: string;
  /** Si présent, le bâtiment ne peut être posé que sur ces terrains. */
  requiresTerrain?: number[];
}

export const BUILDING_DEFS = raw as BuildingDef[];

/** Le type numérique d'un bâtiment est son index dans BUILDING_DEFS. */
export const DEF_INDEX_BY_ID = new Map<string, number>(
  BUILDING_DEFS.map((d, i) => [d.id, i]),
);

export function defIndex(id: string): number {
  const i = DEF_INDEX_BY_ID.get(id);
  if (i === undefined) throw new Error(`Bâtiment inconnu : ${id}`);
  return i;
}

export function def(typeIndex: number): BuildingDef {
  return BUILDING_DEFS[typeIndex];
}
