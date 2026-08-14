import { WORLD_W, WORLD_H } from "../sim/constants";
import { TILE_PX, ZOOM_MIN, ZOOM_MAX } from "./constants";

/**
 * Caméra libre : pas de personnage, pas de cible à suivre.
 * `x` et `y` sont des coordonnées de CASE (flottantes) au centre de l'écran.
 * `zoom` est un nombre de pixels par case.
 */
export interface Camera {
  x: number;
  y: number;
  zoom: number;
  viewW: number;
  viewH: number;
}

export function createCamera(viewW: number, viewH: number): Camera {
  return { x: WORLD_W / 2, y: WORLD_H / 2, zoom: TILE_PX, viewW, viewH };
}

export function screenToWorld(cam: Camera, sx: number, sy: number): { x: number; y: number } {
  return {
    x: cam.x + (sx - cam.viewW / 2) / cam.zoom,
    y: cam.y + (sy - cam.viewH / 2) / cam.zoom,
  };
}

export function worldToScreen(cam: Camera, wx: number, wy: number): { x: number; y: number } {
  return {
    x: (wx - cam.x) * cam.zoom + cam.viewW / 2,
    y: (wy - cam.y) * cam.zoom + cam.viewH / 2,
  };
}

/** Case survolée par le curseur. */
export function screenToTile(cam: Camera, sx: number, sy: number): { x: number; y: number } {
  const w = screenToWorld(cam, sx, sy);
  return { x: Math.floor(w.x), y: Math.floor(w.y) };
}

export function panBy(cam: Camera, dxPixels: number, dyPixels: number): void {
  cam.x -= dxPixels / cam.zoom;
  cam.y -= dyPixels / cam.zoom;
  clamp(cam);
}

/** Zoom centré sur le curseur : le point sous la souris ne bouge pas. */
export function zoomAt(cam: Camera, factor: number, sx: number, sy: number): void {
  const before = screenToWorld(cam, sx, sy);
  cam.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, cam.zoom * factor));
  const after = screenToWorld(cam, sx, sy);
  cam.x += before.x - after.x;
  cam.y += before.y - after.y;
  clamp(cam);
}

function clamp(cam: Camera): void {
  cam.x = Math.min(WORLD_W, Math.max(0, cam.x));
  cam.y = Math.min(WORLD_H, Math.max(0, cam.y));
}

/** Rectangle de cases visibles, en incluant une marge d'une case. */
export function visibleTiles(cam: Camera): { x0: number; y0: number; x1: number; y1: number } {
  const halfW = cam.viewW / 2 / cam.zoom;
  const halfH = cam.viewH / 2 / cam.zoom;
  return {
    x0: Math.max(0, Math.floor(cam.x - halfW) - 1),
    y0: Math.max(0, Math.floor(cam.y - halfH) - 1),
    x1: Math.min(WORLD_W - 1, Math.ceil(cam.x + halfW) + 1),
    y1: Math.min(WORLD_H - 1, Math.ceil(cam.y + halfH) + 1),
  };
}
