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
- List agent wallets
- View wallet details (balance, policy, pending proposals)
- Approve/reject transfers
- Emergency withdraw
- Pause/unpause agent

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```
