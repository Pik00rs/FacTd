import { Application } from "pixi.js";
import { createWorld, type World } from "./sim/world";
import { stepWorld } from "./sim/tick";
import { saveWorld, loadWorld, type SaveFile } from "./sim/serialize";
import { TPS } from "./sim/constants";
import { createCamera } from "./render/camera";
import { Renderer } from "./render/renderer";
import { InputController } from "./render/input";
import { COLOR } from "./render/constants";
import { Hud } from "./ui/hud";

const SAVE_KEY = "factory-td:save";
const STEP_MS = 1000 / TPS;
/** Au-delà, on abandonne le retard accumulé plutôt que d'entrer en spirale de la mort. */
const MAX_CATCHUP_STEPS = 8;

const app = new Application();
await app.init({
  background: COLOR.void,
  resizeTo: window,
  antialias: false,
  autoDensity: true,
  resolution: window.devicePixelRatio,
});
document.body.appendChild(app.canvas);

const state = { world: createWorld(Math.floor(Math.random() * 1e9)) };
const cam = createCamera(app.screen.width, app.screen.height);
const renderer = new Renderer();
const input = new InputController(app.canvas, cam, state.world);
const hud = new Hud((i) => (input.selected = i));

app.stage.addChild(renderer.stage);
document.body.appendChild(hud.root);
hud.select(1); // convoyeur, pour avoir tout de suite quelque chose à poser

// --- Boucle -------------------------------------------------------------
// Le rendu tourne à la fréquence de l'écran, la simulation à pas fixe.
// Les deux sont découplés : c'est ce qui garantit qu'une partie se déroule
// identiquement sur une machine à 60 Hz et sur une à 144 Hz.

let accumulator = 0;
let ticksThisSecond = 0;
let lastUpsSample = performance.now();
let ups = TPS;

app.ticker.add(() => {
  const dtMs = Math.min(250, app.ticker.deltaMS);

  accumulator += dtMs;
  let steps = 0;
  while (accumulator >= STEP_MS && steps < MAX_CATCHUP_STEPS) {
    stepWorld(state.world);
    accumulator -= STEP_MS;
    steps++;
  }
  if (steps === MAX_CATCHUP_STEPS) accumulator = 0;
  ticksThisSecond += steps;

  const now = performance.now();
  if (now - lastUpsSample >= 500) {
    ups = (ticksThisSecond * 1000) / (now - lastUpsSample);
    ticksThisSecond = 0;
    lastUpsSample = now;
  }

  cam.viewW = app.screen.width;
  cam.viewH = app.screen.height;

  input.update(dtMs / 1000);
  hud.syncSelection(input.selected);
  renderer.draw(state.world, cam, input.ghost);
  hud.update(state.world, ups, input.lastReason);
});

// --- Sauvegarde ---------------------------------------------------------

window.addEventListener("keydown", (e) => {
  if (!e.ctrlKey && !e.metaKey) return;
  if (e.code === "KeyS") {
    e.preventDefault();
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveWorld(state.world)));
  }
  if (e.code === "KeyL") {
    e.preventDefault();
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) replaceWorld(loadWorld(JSON.parse(raw) as SaveFile));
  }
});

function replaceWorld(w: World): void {
  state.world = w;
  input.world = w;
}

// Accès console pour le débogage : `game.world.buildings.count`
Object.assign(window, { game: state, cam, save: () => saveWorld(state.world) });
