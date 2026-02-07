# AgentOS Roadmap

## Current scope (Phase 1 — MVP)

- **Human:** Approve or reject proposed transfers, set policy, pause agent, emergency withdraw, rotate keys.
- **Agent:** View agent wallets, add contract addresses, see balance and policy. (Propose/execute transfers via SDK or future UI.)
- **Wallet creation:** Deploy an AgentWallet via the **Foundry script** (`packages/contracts/script/Deploy.s.sol`), then add the deployed contract address in the dashboard. See [SETUP.md](../SETUP.md).

## Next development

### Phase 1.5 — Create wallet from the app ✅

- **Factory contract:** `AgentWalletFactory.sol` deploys AgentWallet instances. Deploy with `forge script script/DeployFactory.s.sol --broadcast`. Set `NEXT_PUBLIC_FACTORY_ADDRESS` (or `FACTORY_ADDRESS` in `packages/contracts/.env`).
- **Dashboard:** "Create wallet" at `/wallets/create` — human connects, fills agent/human/policy (max per tx, daily cap, approval threshold), signs; new wallet is added to the list and user can open it.
- **Wallets page:** Wallet cards first (grid), add-another-wallet form at the bottom so the main view is the list, not the form.

### Phase 2 — x402

- x402 payment middleware, pay-per-request APIs, agent service marketplace.

### Phase 3 — Multi-chain

- Additional chains (Ethereum, Polygon, Solana), cross-chain bridging, universal agent identity.

---

**Summary:** Right now the app is **wallet approval by human** and **agent wallet checking** (view, add addresses). **Agent/human wallet creation from the app** is planned for Phase 1.5 (Factory + UI).
