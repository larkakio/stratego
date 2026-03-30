import {
  BOARD_LEN,
  BOARD_W,
  type Cell,
  type Direction,
  type GameState,
  type Occupant,
  type PieceType,
  type Rank,
  type Side,
  type Unit,
} from "./types";
import { createArmyPieces, inSetupZone, isLake } from "./constants";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `u${idCounter}`;
}

export function idx(row: number, col: number): number {
  return row * BOARD_W + col;
}

export function rc(i: number): { row: number; col: number } {
  return { row: Math.floor(i / BOARD_W), col: i % BOARD_W };
}

export function dirDelta(d: Direction): { dr: number; dc: number } {
  switch (d) {
    case "up":
      return { dr: -1, dc: 0 };
    case "down":
      return { dr: 1, dc: 0 };
    case "left":
      return { dr: 0, dc: -1 };
    case "right":
      return { dr: 0, dc: 1 };
  }
}

/** Farthest legal cell in a cardinal direction from `from` (scout uses full slide). */
export function targetInDirection(
  state: GameState,
  from: number,
  side: Side,
  direction: Direction,
): number | null {
  const legal = legalMoveEndpoints(state, from, side);
  const { dr, dc } = dirDelta(direction);
  const { row: fr, col: fc } = rc(from);
  let best: { to: number; dist: number } | null = null;
  for (const to of legal) {
    const { row: tr, col: tc } = rc(to);
    const ddr = tr - fr;
    const ddc = tc - fc;
    if (dr !== 0) {
      if (ddc !== 0) continue;
      if (ddr === 0 || Math.sign(ddr) !== dr) continue;
      const dist = Math.abs(ddr);
      if (!best || dist > best.dist) best = { to, dist };
    } else {
      if (ddr !== 0) continue;
      if (ddc === 0 || Math.sign(ddc) !== dc) continue;
      const dist = Math.abs(ddc);
      if (!best || dist > best.dist) best = { to, dist };
    }
  }
  return best?.to ?? null;
}

export function rankValue(t: PieceType): Rank | null {
  if (t.kind === "rank") return t.rank;
  return null;
}

export function canMovePieceType(t: PieceType): boolean {
  return t.kind !== "flag" && t.kind !== "bomb";
}

/** Scout (rank 2) slides; others step 1. */
export function isScout(t: PieceType): boolean {
  return t.kind === "rank" && t.rank === 2;
}

export function createInitialState(): GameState {
  const board: Cell[] = Array.from({ length: BOARD_LEN }, () => null);
  return {
    phase: "setup",
    board,
    currentTurn: "player",
    winner: null,
    playerPool: shuffle(createArmyPieces()),
    lastMessage: null,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function placePlayerPiece(
  state: GameState,
  poolIndex: number,
  row: number,
  col: number,
): GameState | null {
  if (state.phase !== "setup") return null;
  if (poolIndex < 0 || poolIndex >= state.playerPool.length) return null;
  if (!inSetupZone("player", row) || isLake(row, col)) return null;
  const i = idx(row, col);
  if (state.board[i]) return null;

  const type = state.playerPool[poolIndex];
  const unit: Unit = {
    id: nextId(),
    side: "player",
    type,
    revealedToOpponent: false,
  };
  const newBoard = [...state.board];
  newBoard[i] = { unit };
  const newPool = state.playerPool.filter((_, j) => j !== poolIndex);
  return {
    ...state,
    board: newBoard,
    playerPool: newPool,
  };
}

/** Auto-place AI randomly in top 4 rows. Call when player setup complete. */
export function finalizeSetup(state: GameState): GameState | null {
  if (state.phase !== "setup" || state.playerPool.length > 0) return null;
  const aiPieces = shuffle(createArmyPieces());
  const newBoard = [...state.board];
  const slots: number[] = [];
  for (let r = 0; r <= 3; r++) {
    for (let c = 0; c < BOARD_W; c++) {
      const i = idx(r, c);
      if (!isLake(r, c) && !newBoard[i]) slots.push(i);
    }
  }
  if (slots.length < aiPieces.length) return null;
  shuffle(slots);
  for (let k = 0; k < aiPieces.length; k++) {
    newBoard[slots[k]] = {
      unit: {
        id: nextId(),
        side: "ai",
        type: aiPieces[k],
        revealedToOpponent: false,
      },
    };
  }
  return {
    ...state,
    board: newBoard,
    phase: "battle",
    currentTurn: "player",
    lastMessage: "Battle. Your move — tap a unit, swipe to move.",
  };
}

export function combatResult(
  attacker: PieceType,
  defender: PieceType,
): "attacker" | "defender" | "both" {
  if (defender.kind === "flag") return "attacker";
  if (defender.kind === "bomb") {
    if (attacker.kind === "rank" && attacker.rank === 3) return "attacker";
    return "defender";
  }
  if (attacker.kind === "bomb" || attacker.kind === "flag") return "defender";

  const ar = attacker.kind === "rank" ? attacker.rank : 0;
  const dr = defender.kind === "rank" ? defender.rank : 0;

  if (ar === 1 && dr === 10) return "attacker";
  if (ar === 1 && dr !== 10) return "defender";
  if (dr === 1 && ar === 10) return "defender";
  if (dr === 1 && ar !== 10) return "attacker";

  if (ar > dr) return "attacker";
  if (dr > ar) return "defender";
  return "both";
}

export function legalMoveEndpoints(
  state: GameState,
  from: number,
  side: Side,
): Set<number> {
  const out = new Set<number>();
  if (state.phase !== "battle") return out;
  const cell = state.board[from];
  if (!cell || cell.unit.side !== side) return out;
  if (!canMovePieceType(cell.unit.type)) return out;

  const dirs: Direction[] = ["up", "down", "left", "right"];
  for (const d of dirs) {
    if (isScout(cell.unit.type)) {
      const { dr, dc } = dirDelta(d);
      let r = rc(from).row + dr;
      let c = rc(from).col + dc;
      while (r >= 0 && r < BOARD_W && c >= 0 && c < BOARD_W) {
        if (isLake(r, c)) break;
        const ti = idx(r, c);
        const t = state.board[ti];
        if (!t) {
          out.add(ti);
          r += dr;
          c += dc;
          continue;
        }
        if (t.unit.side !== side) out.add(ti);
        break;
      }
    } else {
      const { dr, dc } = dirDelta(d);
      const r = rc(from).row + dr;
      const c = rc(from).col + dc;
      if (r < 0 || r >= BOARD_W || c < 0 || c >= BOARD_W) continue;
      if (isLake(r, c)) continue;
      const ti = idx(r, c);
      const t = state.board[ti];
      if (!t) out.add(ti);
      else if (t.unit.side !== side) out.add(ti);
    }
  }
  return out;
}

export function applyMove(
  state: GameState,
  from: number,
  to: number,
): GameState | null {
  if (state.phase !== "battle") return null;
  const side = state.currentTurn;
  const legal = legalMoveEndpoints(state, from, side);
  if (!legal.has(to)) return null;

  const fromCell = state.board[from] as Occupant;
  const target = state.board[to];
  const newBoard = [...state.board];

  if (!target) {
    newBoard[to] = fromCell;
    newBoard[from] = null;
    return afterMove(
      { ...state, board: newBoard },
      side,
      "Moved.",
    );
  }

  const res = combatResult(fromCell.unit.type, target.unit.type);
  const atk = { ...fromCell.unit, revealedToOpponent: true };

  const winMsg = side === "player" ? "You won the fight." : "AI won the fight.";
  const loseMsg = side === "player" ? "Lost that fight." : "AI lost the fight.";

  if (res === "attacker") {
    newBoard[to] = { unit: atk };
    newBoard[from] = null;
    if (target.unit.type.kind === "flag") {
      return endGame({ ...state, board: newBoard }, side);
    }
    return afterMove({ ...state, board: newBoard }, side, winMsg);
  }
  if (res === "defender") {
    newBoard[from] = null;
    if (fromCell.unit.type.kind === "flag") {
      return endGame({ ...state, board: newBoard }, side === "player" ? "ai" : "player");
    }
    return afterMove({ ...state, board: newBoard }, side, loseMsg);
  }
  newBoard[from] = null;
  newBoard[to] = null;
  return afterMove({ ...state, board: newBoard }, side, "Both removed.");
}

function afterMove(state: GameState, moved: Side, msg: string): GameState {
  const next: Side = moved === "player" ? "ai" : "player";
  const s = { ...state, currentTurn: next, lastMessage: msg };
  return checkStalemate(s);
}

function endGame(state: GameState, winner: Side): GameState {
  return {
    ...state,
    phase: "gameover",
    winner,
    currentTurn: winner,
    lastMessage: winner === "player" ? "You captured the flag." : "AI wins.",
  };
}

export function playerHasLegalMove(state: GameState): boolean {
  if (state.phase !== "battle") return true;
  for (let i = 0; i < BOARD_LEN; i++) {
    const c = state.board[i];
    if (!c || c.unit.side !== "player") continue;
    if (legalMoveEndpoints(state, i, "player").size > 0) return true;
  }
  return false;
}

export function aiHasLegalMove(state: GameState): boolean {
  for (let i = 0; i < BOARD_LEN; i++) {
    const c = state.board[i];
    if (!c || c.unit.side !== "ai") continue;
    if (legalMoveEndpoints(state, i, "ai").size > 0) return true;
  }
  return false;
}

/** If side to move cannot move, opponent wins. */
export function checkStalemate(state: GameState): GameState {
  if (state.phase !== "battle") return state;
  if (state.currentTurn === "player" && !playerHasLegalMove(state)) {
    return {
      ...state,
      phase: "gameover",
      winner: "ai",
      lastMessage: "No legal moves. You lose.",
    };
  }
  if (state.currentTurn === "ai" && !aiHasLegalMove(state)) {
    return {
      ...state,
      phase: "gameover",
      winner: "player",
      lastMessage: "Opponent has no moves. You win.",
    };
  }
  return state;
}
