"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { chain } from "@/lib/wagmi/config";

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [open, setOpen] = useState(false);

  const wrong = isConnected && chainId !== chain.id;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="relative z-10 flex flex-wrap items-center gap-2">
      {wrong ? (
        <button
          type="button"
          disabled={switching}
          onClick={() => switchChain({ chainId: chain.id })}
          className="rounded-lg border border-amber-400/70 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-200"
        >
          {switching ? "…" : `Switch to ${chain.name}`}
        </button>
      ) : null}
      {!isConnected ? (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg border border-[var(--neon-cyan)]/70 bg-[var(--neon-cyan)]/10 px-3 py-1.5 text-sm font-medium text-[var(--neon-cyan)]"
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            {isPending ? "…" : "Connect wallet"}
          </button>
          {open ? (
            <>
              <button
                type="button"
                aria-label="Close wallet menu"
                className="fixed inset-0 z-[200] bg-black/70"
                onClick={() => setOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Choose wallet"
                className="fixed left-3 right-3 top-[max(4.5rem,env(safe-area-inset-top,0px)+3.5rem)] z-[210] max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border border-[var(--neon-cyan)]/50 bg-[#0a0a18] py-2 shadow-[0_0_32px_rgba(0,255,255,0.2)] sm:left-auto sm:right-3 sm:top-16 sm:w-72 sm:max-w-[calc(100vw-1.5rem)]"
              >
                <p className="border-b border-white/10 px-4 pb-2 pt-1 text-xs text-[var(--text-muted)]">
                  Select a wallet
                </p>
                <ul className="py-1">
                  {connectors.map((c) => (
                    <li key={c.uid}>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm text-white/95 hover:bg-[var(--neon-cyan)]/10 active:bg-[var(--neon-cyan)]/20"
                        onClick={() => {
                          connect({ connector: c });
                          setOpen(false);
                        }}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
          {error ? (
            <span className="text-xs text-red-400/80">
              {error.message.includes("rejected") ? "Cancelled." : "Connect failed."}
            </span>
          ) : null}
        </>
      ) : (
        <>
          <span className="max-w-[10rem] truncate font-mono text-xs text-[var(--text-muted)]">
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </span>
          <button
            type="button"
            onClick={() => disconnect()}
            className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/70"
          >
            Disconnect
          </button>
        </>
      )}
    </div>
  );
}
