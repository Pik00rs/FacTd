import "./hud.css";
import { BUILDING_DEFS } from "../data/defs";
import type { World } from "../sim/world";
import { dayOf, phaseOf, isAssaultDay, ticksUntilPhaseChange } from "../sim/clock";
import { TPS } from "../sim/constants";

/**
 * L'interface est du DOM classique posé au-dessus du canvas.
 *
 * C'est un choix, pas un raccourci : un jeu d'usine finit avec des inventaires,
 * des sélecteurs de recette, un arbre de technologies et des tableaux de
 * statistiques. Tout ça est pénible dans le système d'UI d'un moteur de jeu,
 * et trivial en HTML/CSS.
 */
export class Hud {
  readonly root = document.createElement("div");
  private valDay = el("span", "value");
  private valPhase = el("span", "value");
  private valBuildings = el("span", "value");
  private valUps = el("span", "value");
  private upsFill = el("div");
  private lamp = el("span", "lamp");
  private message = el("div");
  private slots: HTMLButtonElement[] = [];

  constructor(private onSelect: (index: number | null) => void) {
    this.root.id = "hud";
    this.root.append(this.buildStatus(), this.buildFooter());
  }

  private buildStatus(): HTMLElement {
    const bar = el("div", "plate");
    bar.id = "status";

    const phaseRow = el("div");
    phaseRow.id = "phase-row";
    phaseRow.append(this.lamp, this.valPhase);

    this.upsFill.id = "ups-fill";
    const upsBar = el("div");
    upsBar.id = "ups-bar";
    upsBar.append(this.upsFill);

    const ups = readout("simulation", this.valUps);
    ups.id = "ups";
    ups.append(upsBar);

    bar.append(
      readout("jour", this.valDay),
      readout("cycle", phaseRow),
      readout("structures", this.valBuildings),
      ups,
    );
    return bar;
  }

  private buildFooter(): HTMLElement {
    const footer = el("div");
    footer.id = "footer";

    const left = el("div");
    this.message.id = "message";

    const barWrap = el("div", "plate");
    barWrap.id = "build-bar";

    BUILDING_DEFS.forEach((d, i) => {
      const btn = document.createElement("button");
      btn.className = "slot";
      btn.type = "button";
      btn.setAttribute("aria-pressed", "false");

      const chip = el("span", "chip");
      chip.style.background = d.tint;
      const name = el("span", "name");
      name.textContent = d.name;
      const key = el("span", "key");
      key.textContent = String(i + 1);

      btn.append(chip, name, key);
      btn.addEventListener("click", () => this.select(i));
      this.slots.push(btn);
      barWrap.append(btn);
    });

    const hints = el("div");
    hints.id = "hints";
    hints.innerHTML =
      "clic gauche poser · clic droit détruire · R pivoter<br>molette zoomer · clic milieu ou ZQSD déplacer";

    left.append(this.message);
    footer.append(left, barWrap, hints);
    return footer;
  }

  select(index: number | null): void {
    this.slots.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    this.onSelect(index);
  }

  /** Reflète la sélection décidée au clavier. */
  syncSelection(index: number | null): void {
    this.slots.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
  }

  update(world: World, ups: number, reason: string): void {
    const day = dayOf(world.tick);
    const phase = phaseOf(world.tick);
    const assault = isAssaultDay(day) && phase === "nuit";

    this.valDay.textContent = String(day);
    this.valPhase.textContent = assault
      ? "ASSAUT"
      : `${phase} · ${formatTicks(ticksUntilPhaseChange(world.tick))}`;
    this.valBuildings.textContent = String(world.buildings.count);
    this.valUps.textContent = `${Math.round(ups)} t/s`;
    this.upsFill.style.width = `${Math.min(100, (ups / TPS) * 100)}%`;

    this.lamp.dataset.phase = phase;
    this.lamp.dataset.assault = String(assault);
    this.message.textContent = reason;
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function readout(label: string, value: HTMLElement): HTMLDivElement {
  const wrap = el("div", "readout");
  const l = el("span", "silkscreen");
  l.textContent = label;
  wrap.append(l, value);
  return wrap;
}

function formatTicks(ticks: number): string {
  const s = Math.ceil(ticks / TPS);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
