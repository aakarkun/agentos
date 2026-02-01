# OpenWallet Setup Guide

Quick setup guide for getting started with OpenWallet development.

## Prerequisites

- Node.js 18+ and pnpm 8+
- Foundry (for contracts)
- Postgres (for indexer, optional for MVP)

## Initial Setup

1. **Install pnpm** (if not already installed):
```bash
npm install -g pnpm
```

2. **Install Foundry**:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

3. **Install dependencies**:
```bash
pnpm install
```

4. **Install contract dependencies**:
```bash
cd packages/contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit
cd ../..
```

5. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your values
```

## Development

### Contracts

```bash
cd packages/contracts

# Build
forge build

# Test
forge test

# Deploy (set PRIVATE_KEY, AGENT_ADDRESS, HUMAN_ADDRESS in .env)
forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast --verify
```

### SDK

```bash
cd packages/sdk

# Build
pnpm build

# Watch mode
pnpm dev
```

**Note**: SDK implementation requires contract ABI. After deploying contracts, copy the ABI from `packages/contracts/out/AgentWallet.sol/AgentWallet.json` to `packages/sdk/src/abis/` and update the SDK implementation.

### Dashboard

```bash
cd packages/dashboard

# Install dependencies
pnpm install

# Run dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Indexer (Optional for MVP)

```bash
cd apps/indexer

# Set up Postgres database
createdb openwallet

# Run migrations
pnpm migrate

# Start indexer
pnpm start
```

## Next Steps

1. Deploy AgentWallet contract to Base Sepolia
2. Update SDK with contract ABI and complete implementation
3. Connect dashboard to deployed contracts
4. Set up indexer to track events
5. Test end-to-end flow

## Troubleshooting

### Foundry not found
Make sure Foundry is installed and in your PATH:
```bash
foundryup
```

### pnpm workspace issues
Make sure you're using pnpm 8+:
```bash
pnpm --version
```

### Contract compilation errors
Check that OpenZeppelin is installed:
```bash
cd packages/contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit
```

## Project Structure

```
open-wallet/
├── packages/
│   ├── contracts/     # Solidity contracts (Foundry)
│   ├── sdk/           # TypeScript SDK
│   └── dashboard/     # Next.js dashboard
├── apps/
│   └── indexer/       # Event indexer
└── docs/              # Documentation
```

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [viem Documentation](https://viem.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Base Documentation](https://docs.base.org/)
