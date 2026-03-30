import type { GameState, Occupant } from "./types";
import { applyMove, combatResult, legalMoveEndpoints } from "./engine";

function scoreCombat(
  state: GameState,
  from: number,
  to: number,
): number {
  const fromCell = state.board[from] as Occupant;
  const target = state.board[to] as Occupant;
  const mover = fromCell.unit.type;
  const t = target.unit.type;

  if (t.kind === "flag") return 10_000;
  if (t.kind === "bomb") {
    if (mover.kind === "rank" && mover.rank === 3) return 800;
    return -2000;
  }
  if (t.kind === "rank") {
    const res = combatResult(mover, t);
    if (res === "attacker") return 200 + t.rank * 15;
    if (res === "both") return 40;
    return -80 - (mover.kind === "rank" ? mover.rank * 5 : 0);
  }
  return 0;
}

function scoreQuiet(state: GameState, from: number, to: number): number {
  const fromCell = state.board[from] as Occupant;
  const mover = fromCell.unit.type;
  let s = 20 + Math.random() * 12;
  if (mover.kind === "rank" && mover.rank === 3) s += 15;
  if (mover.kind === "rank" && mover.rank === 2) s += 8;
  const row = Math.floor(to / 10);
  if (row >= 5) s += 6;
  return s;
}

/** Greedy move with full board knowledge. */
export function pickAiMove(state: GameState): { from: number; to: number } | null {
  const candidates: { from: number; to: number; score: number }[] = [];
  for (let i = 0; i < 100; i++) {
    const c = state.board[i];
    if (!c || c.unit.side !== "ai") continue;
    const ends = legalMoveEndpoints(state, i, "ai");
    for (const to of ends) {
      const target = state.board[to];
      const score = target
        ? scoreCombat(state, i, to)
        : scoreQuiet(state, i, to);
      candidates.push({ from: i, to, score });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return { from: candidates[0].from, to: candidates[0].to };
}

export function applyAiTurn(state: GameState): GameState {
  if (state.phase !== "battle" || state.currentTurn !== "ai") return state;
  const m = pickAiMove(state);
  if (!m) return state;
  return applyMove(state, m.from, m.to) ?? state;
}
