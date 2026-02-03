# OpenWallet — Complete Feature Document

**As of:** Current codebase scan.  
**Tagline:** Wallet infrastructure for AI agents. Agents earn, humans oversee.

---

## 1. Overview

OpenWallet is **agent financial governance**: a shared wallet where an **agent** can spend within limits and a **human** funds the wallet and approves or rejects transfers above a threshold. It is not a generic wallet — it is a control plane for agent custody (policy layer, spending limits, human oversight).

### 1.1 Completed Scope (Phase 1 + Phase 1.5)

| Area | Status | Description |
|------|--------|-------------|
| **Contracts** | ✅ | AgentWallet (policy, proposals, human/agent roles) + AgentWalletFactory |
| **SDK** | ✅ | TypeScript SDK: agent API, human API, policy validator, read/write helpers |
| **Dashboard** | ✅ | Next.js app: role-based UI, wallets list, wallet details, create wallet, skills, setup |
| **Skills** | ✅ | Skills config + API routes for agent integration (OpenClaw, etc.) |
| **Indexer** | ✅ | Optional event indexer (Node + Postgres) for AgentWallet events |
| **x402 middleware** | 🔲 | Placeholder only (Phase 2) |

---

## 2. Contracts (`packages/contracts`)

### 2.1 AgentWallet (`src/AgentWallet.sol`)

- **Purpose:** Multi-sig agent wallet with policy layer, spending limits, and human oversight.
- **Roles:**
  - **Agent:** Can propose and execute transfers within policy; can be paused by human.
  - **Human:** Approves/rejects proposals, sets policy, pauses agent, emergency withdraw, rotates keys.

**Policy (on-chain):**

- `maxAmount` — max per transfer (wei)
- `dailyCap` — max per day (0 = unlimited)
- `approvalThreshold` — amount above which human approval is required
- `allowedTokens` — set of token addresses (ETH always allowed)
- `allowedTargets` — (optional) set of recipient addresses

**Proposals:**

- Agent calls `proposeTransfer(to, amount, token, contextHash)`.
- Proposals below threshold can be executed by agent; above threshold require human `approveTransfer` / `rejectTransfer`.
- Human can approve or reject; agent can `executeTransfer` once approved.

**Human-only actions:**

- `approveTransfer` / `rejectTransfer`
- `setPolicy(...)` — update maxAmount, dailyCap, approvalThreshold, allowedTokens/targets
- `emergencyWithdraw(to, tokens)` — withdraw all ETH and/or listed tokens to `to`
- `pauseAgent` / `unpauseAgent`
- `rotateAgentKey(newAgent)` — change agent address
- `initiateHumanKeyRotation(newHuman)` — start timelock (2-day default)
- `completeHumanKeyRotation()` — after timelock, set new human

**Events:** TransferProposed, TransferApproved, TransferRejected, TransferExecuted, PolicyUpdated, AgentPaused/Unpaused, AgentKeyRotated, HumanKeyRotationInitiated, HumanKeyRotated.

### 2.2 AgentWalletFactory (`src/AgentWalletFactory.sol`)

- **Purpose:** Deploy new AgentWallet instances so the dashboard can create wallets from the app.
- **Function:** `createWallet(agent, human, maxAmount, dailyCap, approvalThreshold, allowedTokens)` → returns new wallet address.
- **Event:** `WalletCreated(wallet, agent, human)`.

### 2.3 Deploy Scripts

| Script | Purpose |
|--------|---------|
| `script/Deploy.s.sol` | Deploy a single AgentWallet. Env: `PRIVATE_KEY`, `AGENT_ADDRESS`, `HUMAN_ADDRESS`, optional `USDC_ADDRESS`, `MAX_AMOUNT`, `DAILY_CAP`, `APPROVAL_THRESHOLD`. |
| `script/DeployFactory.s.sol` | Deploy AgentWalletFactory. Env: `PRIVATE_KEY`. Used when "Create wallet" in the app is enabled. |

### 2.4 Tests

- `test/AgentWallet.t.sol` — Foundry tests for AgentWallet.

---

## 3. SDK (`packages/sdk`)

### 3.1 Client (`OpenWalletSDK`)

- **Config:** `walletAddress`, optional `rpcUrl`, `chainId` (defaults Base Sepolia in dev, Base in prod).
- **Methods:**
  - `asAgent(walletClient)` → AgentAPI
  - `asHuman(walletClient)` → HumanAPI
  - `policy` → PolicyValidator (read-only)
  - `getProposal(proposalId)`, `waitForProposal(proposalId, targetStatus?, timeout?)`
  - `getBalance(token?)` — ETH or ERC20 balance of the wallet

### 3.2 Agent API (`sdk.asAgent()`)

- `proposeTransfer(to, amount, token, contextHash)` → proposal ID
- `executeTransfer(proposalId)` → tx hash (for approved proposals)

### 3.3 Human API (`sdk.asHuman()`)

- `approveTransfer(proposalId)`
- `rejectTransfer(proposalId)`
- `setPolicy(policy)` — partial update (maxAmount, dailyCap, approvalThreshold, allowedTargets, allowedTokens)
- `emergencyWithdraw(to, tokens)`
- `pauseAgent()` / `unpauseAgent()`
- `rotateAgentKey(newAgent)`
- `initiateHumanKeyRotation(newHuman)` / `completeHumanKeyRotation()`

### 3.4 Policy Validator (`sdk.policy`)

- `getPolicy()` — read current policy from chain
- `validate(to, amount, token)` — check if transfer is allowed
- `simulateTransfer(to, amount, token)` — pre-flight checks

### 3.5 Types

- `Policy`, `Proposal`, `ProposalStatus`, `SDKConfig` (see `src/types.ts`).

---

## 4. Dashboard (`packages/dashboard`)

**Stack:** Next.js 16, Tailwind, RainbowKit, wagmi, viem, shadcn-style UI (CVA, clsx, tailwind-merge), Hugeicons, next-themes.

**Env:** Dashboard reads from **`packages/contracts/.env`** (single source of truth). Next.config maps `AGENT_ADDRESS` → `NEXT_PUBLIC_AGENT_WALLET_ADDRESSES`, `RPC_URL`/`CHAIN_ID` → `NEXT_PUBLIC_*`, `FACTORY_ADDRESS` → `NEXT_PUBLIC_FACTORY_ADDRESS`. Supports **local Anvil** (31337, http://127.0.0.1:8545) and **Base Sepolia** (84532); when env is local, Localhost chain is added to wagmi and listed first.

### 4.1 Landing (`/`)

- Hero: "A shared wallet: the agent spends (within limits), the human funds and approves."
- **Role selector:** "I'm the Agent" / "I'm the Human" — sets `openwallet-role` in localStorage and redirects to `/wallets`.
- Short explainers: what Agent does (spend within limits, propose/execute) and what Human does (fund, set limits, approve/reject, pause, emergency).

### 4.2 Wallets (`/wallets`)

- **Role banner:** "Viewing as Agent" / "Viewing as Human" with one-sentence explanation.
- **Header:** "Viewing as Agent/Human" pill in app shell (all pages except landing).
- **List:** Wallet cards (name, short address, "View", optional remove for custom wallets). Grid layout; "Add another wallet" form at bottom (contract address + optional name). Custom wallets stored in localStorage (`openwallet-custom-addresses`) as `{ address, name }[]`; env wallets from `NEXT_PUBLIC_AGENT_WALLET_ADDRESSES` or `AGENT_ADDRESS`.
- **Create wallet / Deploy with Foundry:** Links to `/wallets/create` and `/setup`.

### 4.3 Create Wallet (`/wallets/create`)

- **Requires:** `NEXT_PUBLIC_FACTORY_ADDRESS` (or `FACTORY_ADDRESS` in `packages/contracts/.env`) and deployed factory.
- **Flow:** Human connects wallet → form: name, agent address, human address (auto-fill when connected), max per tx (ETH), daily cap (ETH), approval above (ETH). Allowed tokens: ETH + USDC (Base Sepolia) by default. Submit → tx to factory `createWallet(...)` → parse `WalletCreated` from receipt → add new wallet to localStorage and redirect to `/wallet/[address]`.
- **Copy:** Plain-language labels and hints (who can spend, who funds and approves, what each limit means).

### 4.4 Wallet Details (`/wallet/[address]`)

- **Role line:** "You're the human/agent for this wallet" (or "Viewing as Human" / "Viewing wallet") with one sentence on what you can do. Agent line includes link to Skills tab for how to send money via SDK.
- **Sections:**
  - **Balance** — ETH in wallet.
  - **Spending limits** — max per tx, daily cap, approval threshold.
  - **Pending proposals** — list with Approve / Reject (human only, when connected as human).
  - **Roles** — agent address, human address, optional pending human (rotation).
  - **Human actions** (when connected as human): Pause/Unpause agent, Emergency withdraw (ETH to address), Update policy (max, daily cap, threshold), Rotate agent key, Initiate/Complete human key rotation.
- **Back:** "Back to Wallets" → `/wallets`.

### 4.5 Skills (`/skills`)

- **Purpose:** Document and distribute OpenWallet skills for agents (e.g. OpenClaw).
- **Install:** curl one-liner to run install script; script fetches `/api/skills/config` and saves to `~/.openclaw/skills/openwallet.json` (or `OPENCLAW_SKILLS_DIR`).
- **Download config:** Direct link to `/api/skills/config` (JSON).
- **Listed skills (read):** get_balance, list_wallets, get_policy, get_pending_proposals.
- **Listed skills (write):** propose_transfer, approve_transfer, reject_transfer.

### 4.6 Setup (`/setup`)

- **Purpose:** How to get a wallet until in-app creation is used.
- **Steps:** Prerequisites (Node, pnpm, Foundry), deploy wallet via Foundry (`Deploy.s.sol`), add contract address in dashboard, connect wallet for human actions. Copyable commands. Also references factory deploy and env for "Create wallet" flow.

### 4.7 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/skills/config` | GET | Returns OpenWallet skills config (JSON); optional `dashboardUrl` from request origin. |
| `/api/skills/install` | GET | Returns shell script that downloads config to `~/.openclaw/skills/openwallet.json`. |

### 4.8 UI / UX

- **Theme:** Dark by default, next-themes; ThemeToggle in header.
- **Connect:** RainbowKit ConnectButton; WalletConnect project ID from env; dismissible banner if project ID missing or allowlist warning.
- **Components:** AppShell (logo, nav: Overview, Wallets, Skills, Setup), RoleBanner/RolePill, WalletList, WalletDetails, Landing, shadcn-style Button/Card/Input/Tabs, Hugeicons.

---

## 5. Skills Config & API

- **Definition:** `packages/dashboard/src/lib/skills-config.ts` — list of skills (id, name, description, type: read | write).
- **Build:** `buildSkillsConfig(dashboardUrl?)` → `{ openwallet: { version, skills, dashboardUrl? } }`.
- **Served at:** `/api/skills/config` (JSON), `/api/skills/install` (shell script).

---

## 6. Indexer (`apps/indexer`)

- **Purpose:** Thin event indexer for AgentWallet contracts; ingests events and stores in Postgres.
- **Config:** `RPC_URL`, `CHAIN_ID`, `WALLET_ADDRESSES` (comma-separated), `DATABASE_URL`, optional `START_BLOCK`.
- **Usage:** Optional for MVP; run migrations then start indexer for historical/query use cases.

---

## 7. x402 Middleware (`apps/x402-middleware`)

- **Status:** Placeholder only (package.json). Phase 2: pay-per-request APIs, HTTP 402 payment integration.

---

## 8. Repo Structure (Completed Surfaces)

```
open-wallet/
├── packages/
│   ├── contracts/          # Solidity, Foundry
│   │   ├── src/
│   │   │   ├── AgentWallet.sol
│   │   │   └── AgentWalletFactory.sol
│   │   ├── script/
│   │   │   ├── Deploy.s.sol
│   │   │   └── DeployFactory.s.sol
│   │   └── test/
│   │       └── AgentWallet.t.sol
│   ├── sdk/                # @open-wallet/sdk
│   │   └── src/
│   │       ├── client.ts, agent.ts, human.ts, policy.ts, types.ts
│   │       └── abis/
│   └── dashboard/          # Next.js
│       └── src/
│           ├── app/        # routes, api/skills
│           ├── components/
│           └── lib/
├── apps/
│   ├── indexer/            # Event indexer (Postgres)
│   └── x402-middleware/    # Placeholder (Phase 2)
├── docs/
│   ├── FEATURES.md         # This document
│   ├── ROADMAP.md
│   ├── DEMO.md
│   └── THREAT_MODEL.md
├── SETUP.md
├── TROUBLESHOOTING.md
└── CONTRIBUTING.md
```

---

## 9. Configuration Summary

| Where | What |
|-------|------|
| **Chain / RPC** | `packages/contracts/.env`: `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_RPC_URL` (or `CHAIN_ID`, `RPC_URL`). Local: 31337, http://127.0.0.1:8545. Base Sepolia: 84532, https://sepolia.base.org. |
| **WalletConnect** | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `packages/contracts/.env`. |
| **Default wallets** | `NEXT_PUBLIC_AGENT_WALLET_ADDRESSES` or `AGENT_ADDRESS` in `packages/contracts/.env`. |
| **Factory** | `NEXT_PUBLIC_FACTORY_ADDRESS` or `FACTORY_ADDRESS` in `packages/contracts/.env` for "Create wallet" in app. |
| **Dashboard** | Reads all of the above from `packages/contracts/.env` at build/start; restart dev server after env changes. |

---

## 10. Not in Scope (Yet)

- **Phase 2:** x402 payment middleware, pay-per-request APIs.
- **Phase 3:** Multi-chain (Ethereum, Polygon, Solana), cross-chain, universal agent identity.
- **In-dashboard agent transfers:** Agent proposes/executes via SDK (or apps using it) and Skills; no "Propose transfer" form in the dashboard UI.

---

*This document reflects the codebase as scanned. For setup and demo steps, see [SETUP.md](../SETUP.md) and [DEMO.md](DEMO.md). For roadmap and next development, see [ROADMAP.md](ROADMAP.md).*
