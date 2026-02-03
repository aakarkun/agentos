# OpenWallet

**Tagline:** Wallet infrastructure for AI agents. Agents earn, humans oversee.

**Positioning:** OpenWallet is not a wallet — it's **agent financial governance**. A control plane for agent custody (closer to Stripe for agents, Safe + usage policies).

## Architecture

- **Contracts:** Multi-sig agent wallet with policy layer, spending limits, and human oversight
- **SDK:** TypeScript SDK with role-separated API (`asAgent()` / `asHuman()`)
- **Dashboard:** Next.js UI for human oversight and wallet management
- **x402 Middleware:** HTTP 402 payment integration (Phase 2)

## Tech Stack

- **Monorepo:** pnpm workspaces
- **Chain:** Base (primary), Base Sepolia (test)
- **Contracts:** Solidity, Foundry (forge, cast, anvil) + OpenZeppelin
- **SDK:** TypeScript, viem
- **Dashboard:** Next.js + Tailwind + RainbowKit + wagmi + viem
- **Indexer:** Node worker + Postgres

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
open-wallet/
├── packages/
│   ├── contracts/          # Solidity, Foundry, Base
│   ├── sdk/                 # TypeScript SDK (@open-wallet/sdk), viem
│   └── dashboard/           # Next.js + Tailwind + RainbowKit/wagmi/viem
├── apps/
│   └── x402-middleware/     # Phase 2: Express/Fastify server
└── docs/
```

## Development

- [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) — threat model and invariants
- [docs/ROADMAP.md](docs/ROADMAP.md) — current scope and next development (wallet creation from app is Phase 1.5)

## License

MIT
