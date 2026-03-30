import type { PieceType, Rank } from "./types";

/** Classic 40-piece army composition. */
export function createArmyPieces(): PieceType[] {
  const r = (rank: Rank): PieceType => ({ kind: "rank", rank });
  return [
    { kind: "flag" },
    ...Array.from({ length: 6 }, () => ({ kind: "bomb" }) as PieceType),
    r(10),
    r(9),
    r(8),
    r(8),
    r(7),
    r(7),
    r(7),
    r(6),
    r(6),
    r(6),
    r(6),
    r(5),
    r(5),
    r(5),
    r(5),
    r(4),
    r(4),
    r(4),
    r(4),
    r(3),
    r(3),
    r(3),
    r(3),
    r(3),
    r(2),
    r(2),
    r(2),
    r(2),
    r(2),
    r(2),
    r(2),
    r(2),
    r(1),
  ];
}

export function isLake(row: number, col: number): boolean {
  if (row === 4 || row === 5) {
    if ((col === 2 || col === 3) || (col === 6 || col === 7)) return true;
  }
  return false;
}

/** AI setup rows 0–3; player setup rows 6–9 */
export function inSetupZone(side: "player" | "ai", row: number): boolean {
  if (side === "ai") return row >= 0 && row <= 3;
  return row >= 6 && row <= 9;
}
