# AgentOS

**Tagline:** Agent infrastructure for AI agents. API, auth, wallets, payments, and tooling.

**Positioning:** AgentOS is not just a wallet — it's **agent infrastructure**. A control plane for agent identity, custody, and payments (signed Agent API, invoices, transfers, human oversight).

## Status

[![version](https://img.shields.io/badge/version-0.1.0-blue)](./package.json)
[![node](https://img.shields.io/badge/node-%3E%3D20.9-339933?logo=nodedotjs)](./package.json)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8-F69220?logo=pnpm)](./package.json)
[![license](https://img.shields.io/badge/license-MIT-green)](#license)

Signed Agent API, multi-sig wallets, invoices & transfers, and human oversight — one stack. Dashboard, SDK (`@agentos/sdk`), Agent API (health, handshake, me, audit, invoices, transfers), and Foundry contracts on Base.

### News

| Date | Update |
|------|--------|
| 2026-02-07 | Rebrand complete: OpenWallet → AgentOS (docs, packages, SDK). |
| — | Phase 1.5: Factory + create wallet from app; Phase 2: x402 middleware. |
| — | [ROADMAP](docs/ROADMAP.md) · [THREAT_MODEL](docs/THREAT_MODEL.md) · [Agent API example](docs/agent-api-example.md) |

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
