export type Side = "player" | "ai";

/** Combat rank: higher beats lower except special rules (spy, bomb, miner). */
export type Rank =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10;

export type PieceType =
  | { kind: "flag" }
  | { kind: "bomb" }
  | { kind: "rank"; rank: Rank };

export interface Unit {
  id: string;
  side: Side;
  type: PieceType;
  /** Opponent has seen rank after combat or scout reveal optional — for player UI */
  revealedToOpponent: boolean;
}

export interface Occupant {
  unit: Unit;
}

export type Cell = Occupant | null;

export type GamePhase = "setup" | "battle" | "gameover";

export interface GameState {
  phase: GamePhase;
  board: Cell[];
  currentTurn: Side;
  winner: Side | null;
  /** Player pieces not yet placed (setup) */
  playerPool: PieceType[];
  /** Last combat message for UI */
  lastMessage: string | null;
}

export type Direction = "up" | "down" | "left" | "right";

export const BOARD_W = 10;
export const BOARD_H = 10;
export const BOARD_LEN = BOARD_W * BOARD_H;
