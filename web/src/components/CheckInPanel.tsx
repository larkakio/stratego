"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { dailyCheckInAbi } from "@/lib/contracts/dailyCheckIn";
import { getBuilderDataSuffix } from "@/lib/builderCode";
import { chain } from "@/lib/wagmi/config";

function contractAddress(): `0x${string}` | null {
  const raw = process.env.NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS;
  if (!raw || raw === "0x0000000000000000000000000000000000000000") return null;
  return raw as `0x${string}`;
}

export function CheckInPanel() {
  const addr = contractAddress();
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending, error } = useWriteContract();

  const { data: streak } = useReadContract({
    address: addr ?? undefined,
    abi: dailyCheckInAbi,
    functionName: "streakCount",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(addr && address && isConnected) },
    chainId: chain.id,
  });

  async function onDailyCheckIn() {
    if (!address || !addr) return;
    const dataSuffix = getBuilderDataSuffix();
    await writeContractAsync({
      address: addr,
      abi: dailyCheckInAbi,
      functionName: "checkIn",
      chainId: chain.id,
      value: 0n,
      ...(dataSuffix ? { dataSuffix } : {}),
    });
  }

  const canSubmit =
    Boolean(addr) && isConnected && !isPending;

  return (
    <div className="rounded-xl border border-[var(--neon-cyan)]/40 bg-black/40 px-4 py-3 text-sm shadow-[0_0_20px_rgba(0,255,255,0.12)]">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--neon-cyan)]">
        Daily check-in
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[var(--text-muted)]">
          On-chain once per day · Base
          {streak != null && typeof streak === "bigint" ? (
            <span className="ml-2 text-[var(--neon-magenta)]">
              Streak {streak.toString()}
            </span>
          ) : null}
        </span>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void onDailyCheckIn()}
          title={
            !addr
              ? "Set NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS"
              : !isConnected
                ? "Connect your wallet first"
                : undefined
          }
          className="shrink-0 rounded-lg border border-[var(--neon-magenta)]/60 bg-[var(--neon-magenta)]/15 px-3 py-2 font-medium text-[var(--neon-magenta)] transition enabled:hover:bg-[var(--neon-magenta)]/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "…" : "Daily check-in"}
        </button>
      </div>
      {!addr ? (
        <p className="mt-2 text-xs text-amber-200/80">
          Contract address not configured — add{" "}
          <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS</code>{" "}
          to enable transactions.
        </p>
      ) : !isConnected ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Connect a wallet to submit your daily check-in.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-red-400/90">
          {error.message.includes("User rejected")
            ? "Signature cancelled."
            : error.message}
        </p>
      ) : null}
    </div>
  );
}
