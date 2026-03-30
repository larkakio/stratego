"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyAiTurn } from "@/game/ai";
import { isLake } from "@/game/constants";
import {
  applyMove,
  createInitialState,
  finalizeSetup,
  legalMoveEndpoints,
  placePlayerPiece,
  rc,
  targetInDirection,
} from "@/game/engine";
import type { Direction, GameState } from "@/game/types";
import { pieceLabel } from "@/lib/pieceLabel";

const SWIPE_MIN = 36;

function directionFromDelta(dx: number, dy: number): Direction | null {
  if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return null;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

export function StragoGame() {
  /** Avoid SSR/client shuffle mismatch (Math.random in createInitialState). */
  const [game, setGame] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [poolPick, setPoolPick] = useState(0);
  const ptr = useRef<{ x: number; y: number } | null>(null);
  const aiGen = useRef(0);

  useEffect(() => {
    // Randomized setup only on client — avoids SSR/client hydration mismatch.
    queueMicrotask(() => setGame(createInitialState()));
  }, []);

  const reset = useCallback(() => {
    setGame(createInitialState());
    setSelected(null);
    setPoolPick(0);
  }, []);

  useEffect(() => {
    if (!game || game.phase !== "battle" || game.currentTurn !== "ai") return;
    const g = ++aiGen.current;
    const h = window.setTimeout(() => {
      if (g !== aiGen.current) return;
      setGame((s) => (s ? applyAiTurn(s) : s));
    }, 420);
    return () => window.clearTimeout(h);
    // Only re-run when turn phase changes, not on every board update.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gate on turn; `game` would retrigger AI
  }, [game?.phase, game?.currentTurn]);

  if (!game) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-2 pb-8">
        <header className="text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--neon-magenta)] sm:text-3xl">
            NEON STRATEGO
          </h1>
          <p className="mt-3 text-sm text-[var(--text-muted)] motion-safe:animate-pulse">
            Loading board…
          </p>
        </header>
        <div className="aspect-square w-full max-w-md rounded-xl bg-white/5 motion-safe:animate-pulse" />
      </div>
    );
  }

  const st = game;

  function cellLabel(i: number): string {
    const c = st.board[i];
    if (!c) return "";
    const u = c.unit;
    const isPlayer = u.side === "player";
    if (isPlayer) return pieceLabel(u.type, false);
    return pieceLabel(u.type, !u.revealedToOpponent);
  }

  function onCellTap(i: number) {
    const { row, col } = rc(i);
    if (st.phase === "setup") {
      if (!st.playerPool.length) return;
      const next = placePlayerPiece(st, poolPick, row, col);
      if (next) {
        setGame(next);
        setPoolPick(0);
      }
      return;
    }
    if (st.phase !== "battle") return;
    if (st.currentTurn !== "player") return;
    const cell = st.board[i];
    if (cell?.unit.side === "player") {
      setSelected(selected === i ? null : i);
      return;
    }
    if (selected != null) {
      const next = applyMove(st, selected, i);
      if (next) {
        setGame(next);
        setSelected(null);
      }
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (st.phase !== "battle" || st.currentTurn !== "player") return;
    ptr.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: React.PointerEvent) {
    if (st.phase !== "battle" || st.currentTurn !== "player") return;
    const start = ptr.current;
    ptr.current = null;
    if (selected == null || !start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dir = directionFromDelta(dx, dy);
    if (!dir) return;
    const to = targetInDirection(st, selected, "player", dir);
    if (to == null) return;
    const next = applyMove(st, selected, to);
    if (next) {
      setGame(next);
      setSelected(null);
    }
  }

  function startBattle() {
    const next = finalizeSetup(st);
    if (next) setGame(next);
  }

  const legal =
    selected != null && st.phase === "battle" && st.currentTurn === "player"
      ? legalMoveEndpoints(st, selected, "player")
      : new Set<number>();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-2 pb-8">
      <header className="text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--neon-magenta)] drop-shadow-[0_0_12px_rgba(255,0,255,0.45)] sm:text-3xl">
          NEON STRATEGO
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          You · bottom · swipe after selecting a unit
        </p>
      </header>

      {st.phase === "setup" && st.playerPool.length > 0 ? (
        <div className="rounded-xl border border-[var(--neon-cyan)]/30 bg-black/50 p-3">
          <p className="mb-2 text-center text-sm text-[var(--neon-cyan)]">
            Place your army (tap cell). Piece:{" "}
            <span className="font-mono text-[var(--neon-lime)]">
              {pieceLabel(st.playerPool[Math.min(poolPick, st.playerPool.length - 1)]!, false)}
            </span>
          </p>
          <div className="mb-2 flex max-h-24 flex-wrap justify-center gap-1 overflow-y-auto">
            {st.playerPool.map((p, i) => (
              <button
                key={`${i}-${pieceLabel(p, false)}`}
                type="button"
                onClick={() => setPoolPick(i)}
                className={`min-w-8 rounded border px-2 py-1 font-mono text-xs ${
                  i === poolPick
                    ? "border-[var(--neon-magenta)] bg-[var(--neon-magenta)]/20 text-[var(--neon-magenta)]"
                    : "border-white/20 text-white/70"
                }`}
              >
                {pieceLabel(p, false)}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-[var(--text-muted)]">
            {st.playerPool.length} left · rows 6–9
          </p>
        </div>
      ) : null}

      {st.phase === "setup" && st.playerPool.length === 0 ? (
        <button
          type="button"
          onClick={startBattle}
          className="mx-auto rounded-xl border-2 border-[var(--neon-lime)] bg-[var(--neon-lime)]/15 px-6 py-3 font-semibold text-[var(--neon-lime)] shadow-[0_0_24px_rgba(0,255,136,0.25)]"
        >
          Start battle
        </button>
      ) : null}

      {st.lastMessage ? (
        <p className="text-center text-sm text-[var(--neon-cyan)]/90">{st.lastMessage}</p>
      ) : null}

      <div
        className="relative touch-none rounded-xl border border-[var(--neon-magenta)]/35 bg-[#070714]/90 p-1 shadow-[0_0_40px_rgba(255,0,255,0.12)]"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          ptr.current = null;
        }}
      >
        <div
          className="grid aspect-square w-full grid-cols-10 grid-rows-10 gap-0.5"
          style={{
            gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
            gridTemplateRows: "repeat(10, minmax(0, 1fr))",
          }}
        >
          {Array.from({ length: 100 }, (_, i) => {
            const { row, col } = rc(i);
            const lake = isLake(row, col);
            const isSel = selected === i;
            const isLeg = legal.has(i);
            return (
              <button
                key={i}
                type="button"
                disabled={
                  lake ||
                  (st.phase === "battle" && st.currentTurn !== "player")
                }
                onClick={() => onCellTap(i)}
                className={[
                  "relative flex min-h-0 min-w-0 items-center justify-center rounded-sm font-mono text-[10px] sm:text-xs",
                  lake
                    ? "cursor-default bg-[#0a1a2a] text-transparent"
                    : "border border-white/10 bg-[#12122a]/90 text-white/90",
                  isSel ? "z-10 ring-2 ring-[var(--neon-magenta)] ring-offset-1 ring-offset-[#070714]" : "",
                  isLeg ? "shadow-[inset_0_0_12px_rgba(0,255,255,0.35)]" : "",
                  st.phase === "battle" && st.currentTurn !== "player"
                    ? "opacity-90"
                    : "",
                ].join(" ")}
              >
                {!lake ? cellLabel(i) : "~"}
              </button>
            );
          })}
        </div>
      </div>

      {selected != null &&
      st.phase === "battle" &&
      st.currentTurn === "player" ? (
        <div className="grid grid-cols-4 gap-2 px-2">
          {(
            [
              ["up", "↑"],
              ["left", "←"],
              ["right", "→"],
              ["down", "↓"],
            ] as const
          ).map(([dir, label]) => (
            <button
              key={dir}
              type="button"
              onClick={() => {
                const to = targetInDirection(st, selected, "player", dir);
                if (to == null) return;
                const next = applyMove(st, selected, to);
                if (next) {
                  setGame(next);
                  setSelected(null);
                }
              }}
              className="rounded-lg border border-[var(--neon-cyan)]/50 py-3 text-lg text-[var(--neon-cyan)]"
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {st.phase === "gameover" ? (
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--neon-lime)]">
            {st.winner === "player" ? "Victory" : "Defeat"}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-3 rounded-lg border border-[var(--neon-cyan)] px-4 py-2 text-sm text-[var(--neon-cyan)]"
          >
            Play again
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/25 px-3 py-1.5 text-xs text-white/60"
        >
          Reset game
        </button>
      </div>
    </div>
  );
}
