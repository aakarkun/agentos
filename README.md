# AgentOS

**Tagline:** Agent infrastructure for AI agents. API, auth, wallets, payments, and tooling.

**Positioning:** AgentOS is not just a wallet — it's **agent infrastructure**. A control plane for agent identity, custody, and payments (signed Agent API, invoices, transfers, human oversight).

## Architecture

- **Contracts:** Multi-sig agent wallet with policy layer, spending limits, and human oversight
- **SDK:** TypeScript SDK with role-separated API (`asAgent()` / `asHuman()`)
- **Dashboard:** Next.js UI for human oversight, wallet management, Agent API (health, handshake, me, audit, invoices, transfers)
- **Agent API:** Signed-message auth, replay protection, Lexa/Eliza-ready adapter (`@agentos/eliza-adapter`)
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
agentos/
├── packages/
│   ├── contracts/          # Solidity, Foundry, Base
│   ├── sdk/                 # TypeScript SDK (@agentos/sdk), viem
│   ├── dashboard/           # Next.js + Tailwind + RainbowKit/wagmi/viem
│   ├── agentos-client/      # Node client for Agent API (signed requests)
│   └── agentos-eliza-adapter/  # Lexa/Eliza-ready adapter
├── apps/
│   └── x402-middleware/     # Phase 2: Express/Fastify server
└── docs/
```

## Development

- [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) — threat model and invariants
- [docs/ROADMAP.md](docs/ROADMAP.md) — current scope and next development
- [docs/agent-api-example.md](docs/agent-api-example.md) — Agent API auth and quick test

## License

MIT
