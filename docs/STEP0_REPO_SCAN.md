# STEP 0 — Repo Scan Output (AgentOS Weekend 1)

## A) Repo tree (high level)

```
open-wallet/
├── packages/
│   ├── contracts/     # Foundry: AgentWallet.sol, AgentWalletFactory.sol
│   ├── sdk/           # @open-wallet/sdk: agent.ts, human.ts, policy.ts, client.ts, abis
│   └── dashboard/     # Next.js App Router, shadcn/ui, RainbowKit/wagmi
├── apps/
│   ├── indexer/       # Node worker + Postgres (events)
│   └── x402-middleware/
├── docs/
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## B) Current dashboard routes (`packages/dashboard/src/app`)

| Path | Purpose |
|------|--------|
| `/` | Landing: role selector (Agent / Human) → redirects to /wallets |
| `/wallets` | List wallets (env + custom from localStorage); "Create wallet" link |
| `/wallets/create` | Create new AgentWallet via factory (agent, human, policy params) |
| `/wallet/[address]` | Wallet details: policy, proposals, approve/reject, pause, balance |
| `/setup` | Setup instructions (deploy, env, add wallet) |
| `/skills` | Skills config for agents (OpenClaw); install script + JSON |
| `/api/skills/config` | GET — returns skills JSON |
| `/api/skills/install` | GET — returns shell script to save config to ~/.openclaw/skills/openwallet.json |

## C) Current env system

- **Source of truth:** `packages/contracts/.env` (loaded at build/start by `packages/dashboard/next.config.js` via `loadContractsEnv()`).
- **Mapping:** If `NEXT_PUBLIC_*` not set, next.config maps:
  - `AGENT_ADDRESS` → `NEXT_PUBLIC_AGENT_WALLET_ADDRESSES`
  - `RPC_URL` → `NEXT_PUBLIC_RPC_URL`
  - `CHAIN_ID` → `NEXT_PUBLIC_CHAIN_ID`
  - `FACTORY_ADDRESS` → `NEXT_PUBLIC_FACTORY_ADDRESS`
- **NEXT_PUBLIC_* vars used:**
  - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — RainbowKit (providers.tsx)
  - `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_RPC_URL` — wagmi chain, sdk.ts
  - `NEXT_PUBLIC_AGENT_WALLET_ADDRESSES` — default wallet list (sdk.ts)
  - `NEXT_PUBLIC_FACTORY_ADDRESS` — create wallet (factory.ts)
- **Optional:** `packages/dashboard/.env` or root `.env`; dashboard README says put real keys in `packages/contracts/.env`.

## D) Current token transfer utilities

- **On-chain:** `packages/contracts/src/AgentWallet.sol`
  - `_executeTransfer(proposalId)`: if `token == address(0)` sends ETH via `call{value}`, else `IERC20(token).safeTransfer(to, amount)`.
- **SDK:** `packages/sdk/src/agent.ts`
  - `AgentAPI.proposeTransfer(to, amount, token, contextHash)` — writeContract to AgentWallet.
  - `AgentAPI.executeTransfer(proposalId)` — writeContract executeTransfer.
- **Dashboard:** No direct EOA→contract ETH/ERC20 send. Wallet creation is via factory; spending is via contract proposals. For AgentPay Lite, payment will be **payer EOA → to_wallet_address** (ETH or ERC20) from the public pay page; we will add that flow in the dashboard using wagmi/viem.
