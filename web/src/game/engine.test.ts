import { describe, expect, it } from "vitest";
import { createArmyPieces } from "./constants";
import {
  combatResult,
  createInitialState,
  finalizeSetup,
  placePlayerPiece,
} from "./engine";
import type { GameState } from "./types";

describe("createArmyPieces", () => {
  it("has 40 pieces", () => {
    expect(createArmyPieces()).toHaveLength(40);
  });
});

describe("combatResult", () => {
  it("marshal beats captain", () => {
    expect(
      combatResult({ kind: "rank", rank: 10 }, { kind: "rank", rank: 6 }),
    ).toBe("attacker");
  });
  it("spy kills marshal when attacking", () => {
    expect(
      combatResult({ kind: "rank", rank: 1 }, { kind: "rank", rank: 10 }),
    ).toBe("attacker");
  });
  it("marshal kills spy when attacking", () => {
    expect(
      combatResult({ kind: "rank", rank: 10 }, { kind: "rank", rank: 1 }),
    ).toBe("defender");
  });
  it("miner defuses bomb", () => {
    expect(combatResult({ kind: "rank", rank: 3 }, { kind: "bomb" })).toBe(
      "attacker",
    );
  });
  it("bomb kills sergeant", () => {
    expect(combatResult({ kind: "rank", rank: 4 }, { kind: "bomb" })).toBe(
      "defender",
    );
  });
  it("captures flag", () => {
    expect(combatResult({ kind: "rank", rank: 6 }, { kind: "flag" })).toBe(
      "attacker",
    );
  });
});

function fillPlayerRows(state: GameState): GameState {
  let s = state;
  for (let r = 6; r <= 9; r++) {
    for (let c = 0; c < 10; c++) {
      if (s.playerPool.length === 0) return s;
      const next = placePlayerPiece(s, 0, r, c);
      if (!next) throw new Error("place failed");
      s = next;
    }
  }
  return s;
}

describe("setup and battle", () => {
  it("finalizes when all player pieces placed", () => {
    let s = createInitialState();
    s = fillPlayerRows(s);
    expect(s.playerPool).toHaveLength(0);
    const b = finalizeSetup(s);
    expect(b?.phase).toBe("battle");
    expect(b?.board.filter(Boolean)).toHaveLength(80);
  });

  it("scout slides over empty cells", () => {
    const s = fillPlayerRows(createInitialState());
    const fin = finalizeSetup(s);
    expect(fin).not.toBeNull();
    const scouts = fin!.board.filter(
      (c) =>
        c?.unit.side === "player" &&
        c.unit.type.kind === "rank" &&
        c.unit.type.rank === 2,
    );
    expect(scouts.length).toBeGreaterThanOrEqual(1);
  });
});
