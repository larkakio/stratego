# DailyCheckIn (Foundry)

Solidity contract for a free daily on-chain check-in on Base. Users pay only L2 gas; `msg.value` must be zero.

## Test

```bash
forge test
```

## Deploy (Base mainnet example)

From the `contracts/` directory, with `PRIVATE_KEY` as a **hex private key (0x… or uint)** in the environment:

```bash
export PRIVATE_KEY=0x...   # never commit this; use a dedicated deployer key
export RPC_URL=https://mainnet.base.org

forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC_URL" \
  --broadcast \
  -vvvv
```

Alternative without `PRIVATE_KEY` in env (pass key on the CLI):

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  -vvvv
```

Copy the deployed contract address into `NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS` in `web/.env.local` (or Vercel).

Latest deploy on Base mainnet (chain 8453) from this repo: `0x13cB3a8aa1Bde3F0b731f004D34E19916F7d0Dcd` (tx hash `0x06133245a3d23fc1af10717142f9c3c1090179758659908db065492ab41c36d7`).

`forge build` must succeed before `forge script`; if you see **No such file or directory**, the script path is wrong — use `script/Deploy.s.sol:Deploy` as above.
