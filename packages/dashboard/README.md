# OpenWallet Dashboard

Next.js dashboard for OpenWallet agent wallet oversight.

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Connect wallet with RainbowKit
- List agent wallets (from env + add/remove; persisted in localStorage)
- View wallet details (balance, policy, pending proposals, roles, agent paused status)
- Approve/reject transfers (when connected as human)
- **Human actions** (when connected as the wallet’s human):
  - Pause / Unpause agent
  - Emergency withdraw (all ETH to a recipient)
  - Update policy (max per tx, daily cap, approval threshold in ETH)
  - Rotate agent key (set new agent address)
  - Human key rotation (initiate with new human address; complete after timelock)

## Environment Variables

The dashboard reads env from **`packages/contracts/.env`** (the same file used by the Foundry deploy script). Put all keys there so one file is the source of truth.

- **NEXT_PUBLIC_*** vars are read directly (e.g. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_AGENT_WALLET_ADDRESSES`).
- **AGENT_ADDRESS** is mapped to `NEXT_PUBLIC_AGENT_WALLET_ADDRESSES` if that’s not set (so the deployed agent wallet shows by default).
- **RPC_URL** and **CHAIN_ID** are mapped to `NEXT_PUBLIC_RPC_URL` and `NEXT_PUBLIC_CHAIN_ID` if those aren’t set.

1. In `packages/contracts/`, copy `.env.example` to `.env` and fill in your values (deploy keys + dashboard keys below).
2. Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (get a free ID at [WalletConnect Cloud](https://cloud.walletconnect.com)).
3. Set `NEXT_PUBLIC_CHAIN_ID` and `NEXT_PUBLIC_RPC_URL` (or `CHAIN_ID` / `RPC_URL`) to match where your wallet is deployed.
4. Restart the dashboard dev server after changing env.

**WalletConnect / Reown:** In [Reown Cloud](https://cloud.reown.com) → your project → **Domain** → Allowed origins, add `http://localhost:3000` (and your production URL when you deploy).
