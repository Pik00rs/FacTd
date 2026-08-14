import type { World } from "../sim/world";
import { canPlace, place, removeAt } from "../sim/world";
import { footprint } from "../sim/grid";
import { def, BUILDING_DEFS } from "../data/defs";
import type { Camera } from "./camera";
import { panBy, zoomAt, screenToTile } from "./camera";
import { ZOOM_STEP } from "./constants";
import type { GhostState } from "./renderer";

/**
 * Commandes (calquées sur les habitudes du genre, ne pas réinventer) :
 *   molette         zoom sur le curseur
 *   clic milieu     déplacer la vue
 *   ZQSD / flèches  déplacer la vue
 *   clic gauche     poser (maintenir pour poser en ligne)
 *   clic droit      détruire (maintenir pour détruire en ligne)
 *   R               pivoter
 *   1..7            choisir un bâtiment
 *   Échap           reposer l'outil
 */
export class InputController {
  selected: number | null = null;
  rot = 0;
  ghost: GhostState | null = null;
  lastReason = "";

  private mouseX = 0;
  private mouseY = 0;
  private panning = false;
  private placing = false;
  private erasing = false;
  private keys = new Set<string>();

  constructor(
    private canvas: HTMLCanvasElement,
    private cam: Camera,
    public world: World,
  ) {
    this.attach();
  }

  private attach(): void {
    const c = this.canvas;
    c.addEventListener("contextmenu", (e) => e.preventDefault());

    c.addEventListener("pointerdown", (e) => {
      c.setPointerCapture(e.pointerId);
      if (e.button === 1) this.panning = true;
      if (e.button === 0) {
        this.placing = true;
        this.tryPlace();
      }
      if (e.button === 2) {
        this.erasing = true;
        this.tryErase();
      }
    });

    c.addEventListener("pointerup", () => {
      this.panning = false;
      this.placing = false;
      this.erasing = false;
    });

    c.addEventListener("pointermove", (e) => {
      this.mouseX = e.offsetX;
      this.mouseY = e.offsetY;
      if (this.panning) panBy(this.cam, e.movementX, e.movementY);
      if (this.placing) this.tryPlace();
      if (this.erasing) this.tryErase();
    });

    c.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        zoomAt(this.cam, e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, e.offsetX, e.offsetY);
      },
      { passive: false },
    );

    window.addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (e.code === "KeyR") this.rot = (this.rot + 1) % 4;
      if (e.code === "Escape") this.selected = null;
      const n = Number(e.key);
      if (n >= 1 && n <= BUILDING_DEFS.length) this.selected = n - 1;
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());
  }

  /** Appelé une fois par image, avant le rendu. */
  update(dtSeconds: number): void {
    const speed = 900 * dtSeconds; // pixels/seconde, indépendant du zoom
    let dx = 0;
    let dy = 0;
    if (this.keys.has("KeyA") || this.keys.has("KeyQ") || this.keys.has("ArrowLeft")) dx += speed;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) dx -= speed;
    if (this.keys.has("KeyW") || this.keys.has("KeyZ") || this.keys.has("ArrowUp")) dy += speed;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) dy -= speed;
    if (dx !== 0 || dy !== 0) panBy(this.cam, dx, dy);

    this.updateGhost();
  }

  private anchor(): { x: number; y: number } {
    // Le curseur vise le CENTRE de l'empreinte, pas son coin : c'est ce qu'attend
    // la main quand on pose une fonderie 3x3.
    const t = screenToTile(this.cam, this.mouseX, this.mouseY);
    if (this.selected === null) return t;
    const d = def(this.selected);
    const fp = footprint(d.w, d.h, this.rot);
    return { x: t.x - ((fp.w - 1) >> 1), y: t.y - ((fp.h - 1) >> 1) };
  }

  private updateGhost(): void {
    if (this.selected === null) {
      this.ghost = null;
      this.lastReason = "";
      return;
    }
    const a = this.anchor();
    const check = canPlace(this.world, this.selected, a.x, a.y, this.rot);
    this.lastReason = check.reason ?? "";
    this.ghost = { typeIndex: this.selected, x: a.x, y: a.y, rot: this.rot, valid: check.ok };
  }

  private tryPlace(): void {
    if (this.selected === null) return;
    const a = this.anchor();
    place(this.world, this.selected, a.x, a.y, this.rot);
  }

  private tryErase(): void {
    const t = screenToTile(this.cam, this.mouseX, this.mouseY);
    removeAt(this.world, t.x, t.y);
  }
}
