# Stratego · Base

Mobile-first **Neon Stratego** (human vs AI) with **wagmi/viem**, optional **daily on-chain check-in** on Base, and **Foundry** contract `DailyCheckIn`.

## Quick start

```bash
cd web && npm install && npm run dev
```

Or from the repo root:

```bash
npm install --prefix web && npm run dev
```

Production: [https://stratego-five.vercel.app](https://stratego-five.vercel.app) · local dev: [http://localhost:3000](http://localhost:3000).

## Environment

Copy `web/.env.example` to `web/.env.local` and set `NEXT_PUBLIC_*` variables (chain, contract address, Base app id, builder code).

## Contracts

```bash
cd contracts && forge test
```

Deploy: see [contracts/README.md](contracts/README.md).

## Layout

- `web/` — Next.js app (Vercel **Root Directory** = `web`)
- `contracts/` — Foundry project
