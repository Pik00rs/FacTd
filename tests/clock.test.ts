import { describe, it, expect } from "vitest";
import { dayOf, phaseOf, isAssaultDay, cycleProgress, ticksUntilPhaseChange, threatLevel } from "../src/sim/clock";
import { DAY_TICKS, NIGHT_START } from "../src/sim/constants";

describe("calendrier jour / nuit", () => {
  it("compte les jours à partir de 1", () => {
    expect(dayOf(0)).toBe(1);
    expect(dayOf(DAY_TICKS - 1)).toBe(1);
    expect(dayOf(DAY_TICKS)).toBe(2);
    expect(dayOf(DAY_TICKS * 6)).toBe(7);
  });

  it("bascule en nuit au bon moment du cycle", () => {
    expect(phaseOf(0)).toBe("jour");
    expect(phaseOf(Math.floor(DAY_TICKS * (NIGHT_START - 0.01)))).toBe("jour");
    expect(phaseOf(Math.ceil(DAY_TICKS * NIGHT_START))).toBe("nuit");
    expect(phaseOf(DAY_TICKS - 1)).toBe("nuit");
  });

  it("annonce correctement le temps restant avant bascule", () => {
    const t = 0;
    const remaining = ticksUntilPhaseChange(t);
    expect(phaseOf(t + remaining)).toBe("nuit");
    expect(cycleProgress(0)).toBe(0);
  });

  it("déclenche un assaut tous les 7 jours", () => {
    expect(isAssaultDay(7)).toBe(true);
    expect(isAssaultDay(14)).toBe(true);
    expect(isAssaultDay(21)).toBe(true);
    for (const d of [1, 2, 3, 4, 5, 6, 8, 13]) expect(isAssaultDay(d)).toBe(false);
  });

  it("fait monter la menace avec les jours et triple les nuits d'assaut", () => {
    const nuitJ1 = Math.floor(DAY_TICKS * 0.9);
    const nuitJ7 = DAY_TICKS * 6 + Math.floor(DAY_TICKS * 0.9);
    expect(threatLevel(nuitJ7)).toBeGreaterThan(threatLevel(nuitJ1) * 3);
    expect(threatLevel(DAY_TICKS * 6)).toBeLessThan(threatLevel(nuitJ7));
  });
});
