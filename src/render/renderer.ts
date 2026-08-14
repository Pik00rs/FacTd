import { Container, Graphics } from "pixi.js";
import type { World } from "../sim/world";
import { NO_BUILDING } from "../sim/constants";
import { idx, footprint } from "../sim/grid";
import { def } from "../data/defs";
import { phaseOf } from "../sim/clock";
import type { Camera } from "./camera";
import { visibleTiles, worldToScreen } from "./camera";
import { COLOR, TERRAIN_COLOR, GRID_VISIBLE_ABOVE, hexToInt } from "./constants";

/**
 * Le rendu LIT le monde et ne le modifie jamais. Aucune fonction de ce fichier
 * ne doit écrire dans `world`.
 *
 * Approche phase 1 : on redessine les cases visibles dans un seul objet
 * Graphics. C'est simple et suffisant tant qu'on reste sous ~5000 cases à
 * l'écran. En phase 6, remplacer par un atlas de sprites et un tilemap en
 * cache — mais pas avant d'en avoir mesuré le besoin.
 */
export class Renderer {
  readonly stage = new Container();
  private terrainLayer = new Graphics();
  private buildingLayer = new Graphics();
  private overlayLayer = new Graphics();
  /** Le terrain ne change pas tant que la caméra et la phase ne bougent pas. */
  private terrainKey = "";

  constructor() {
    this.stage.addChild(this.terrainLayer, this.buildingLayer, this.overlayLayer);
  }

  draw(world: World, cam: Camera, ghost: GhostState | null): void {
    const view = visibleTiles(cam);
    this.drawTerrain(world, cam, view);
    this.drawBuildings(world, cam, view);
    this.drawOverlay(cam, ghost);
  }

  private drawTerrain(world: World, cam: Camera, v: Bounds): void {
    const z = cam.zoom;
    // La nuit assombrit la scène sans toucher à la simulation : pur rendu.
    const dark = phaseOf(world.tick) === "nuit" ? 0.55 : 1;

    // Redessiner 3000 rectangles à chaque image est inutile quand rien ne bouge.
    // On reconstruit la couche seulement si la vue ou la phase a changé.
    const key = `${v.x0},${v.y0},${v.x1},${v.y1},${cam.x.toFixed(3)},${cam.y.toFixed(3)},${z},${dark}`;
    if (key === this.terrainKey) return;
    this.terrainKey = key;

    const g = this.terrainLayer;
    g.clear();

    for (let y = v.y0; y <= v.y1; y++) {
      for (let x = v.x0; x <= v.x1; x++) {
        const s = worldToScreen(cam, x, y);
        const color = TERRAIN_COLOR[world.terrain[idx(x, y)]] ?? COLOR.ground;
        g.rect(s.x, s.y, z + 1, z + 1).fill({ color, alpha: dark });
      }
    }

    if (z >= GRID_VISIBLE_ABOVE) {
      for (let x = v.x0; x <= v.x1 + 1; x++) {
        const s = worldToScreen(cam, x, v.y0);
        g.moveTo(s.x, s.y).lineTo(s.x, worldToScreen(cam, x, v.y1 + 1).y);
      }
      for (let y = v.y0; y <= v.y1 + 1; y++) {
        const s = worldToScreen(cam, v.x0, y);
        g.moveTo(s.x, s.y).lineTo(worldToScreen(cam, v.x1 + 1, y).x, s.y);
      }
      g.stroke({ width: 1, color: COLOR.gridLine, alpha: 0.9 });
    }
  }

  private drawBuildings(world: World, cam: Camera, v: Bounds): void {
    const g = this.buildingLayer;
    g.clear();

    const b = world.buildings;
    const seen = new Set<number>();
    const z = cam.zoom;

    // On itère sur les cases visibles plutôt que sur tous les bâtiments :
    // le coût suit la taille de l'écran, pas la taille de l'usine.
    for (let y = v.y0; y <= v.y1; y++) {
      for (let x = v.x0; x <= v.x1; x++) {
        const id = world.tileBuilding[idx(x, y)];
        if (id === NO_BUILDING || seen.has(id)) continue;
        seen.add(id);

        const d = def(b.type[id]);
        const fp = footprint(d.w, d.h, b.rot[id]);
        const s = worldToScreen(cam, b.x[id], b.y[id]);
        g.rect(s.x + 1, s.y + 1, fp.w * z - 2, fp.h * z - 2).fill(hexToInt(d.tint));

        // Ergot d'orientation : sans lui, impossible de lire le sens d'un convoyeur.
        if (d.rotatable && z >= 12) {
          const cx = s.x + (fp.w * z) / 2;
          const cy = s.y + (fp.h * z) / 2;
          const r = Math.min(fp.w, fp.h) * z * 0.3;
          const rot = b.rot[id];
          const dx = [0, 1, 0, -1][rot];
          const dy = [-1, 0, 1, 0][rot];
          g.circle(cx + dx * r, cy + dy * r, Math.max(1.5, z * 0.09)).fill(COLOR.lamp);
        }
      }
    }
  }

  private drawOverlay(cam: Camera, ghost: GhostState | null): void {
    const g = this.overlayLayer;
    g.clear();
    if (!ghost) return;

    const d = def(ghost.typeIndex);
    const fp = footprint(d.w, d.h, ghost.rot);
    const s = worldToScreen(cam, ghost.x, ghost.y);
    const z = cam.zoom;

    g.rect(s.x, s.y, fp.w * z, fp.h * z).fill({
      color: ghost.valid ? COLOR.ghostOk : COLOR.ghostBad,
      alpha: 0.28,
    });
    g.rect(s.x, s.y, fp.w * z, fp.h * z).stroke({
      width: 2,
      color: ghost.valid ? COLOR.ghostOk : COLOR.ghostBad,
    });
  }
}

interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface GhostState {
  typeIndex: number;
  x: number;
  y: number;
  rot: number;
  valid: boolean;
  reason?: string;
}
