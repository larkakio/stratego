import { CheckInPanel } from "@/components/CheckInPanel";
import { StragoGame } from "@/components/StragoGame";
import { WalletBar } from "@/components/WalletBar";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
        <WalletBar />
      </div>
      <div className="mx-auto w-full max-w-md px-3 pt-4">
        <CheckInPanel />
      </div>
      <StragoGame />
    </main>
  );
}
