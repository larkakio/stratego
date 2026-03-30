import type { PieceType } from "@/game/types";

export function pieceLabel(
  t: PieceType,
  hidden: boolean,
): string {
  if (hidden) return "?";
  if (t.kind === "flag") return "⚑";
  if (t.kind === "bomb") return "☢";
  if (t.kind === "rank") {
    if (t.rank === 1) return "Sp";
    if (t.rank === 2) return "Sc";
    if (t.rank === 3) return "Mn";
    return String(t.rank);
  }
  return "?";
}
