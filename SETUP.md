# AgentOS Setup Guide

Quick setup guide for getting started with AgentOS development.

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

#### Deploy the Factory (for "Create wallet" in the dashboard)

The dashboard can create new agent wallets from the app if you deploy the factory and point the app at it.

1. **Use the same env** as above: `packages/contracts/.env` with at least `PRIVATE_KEY` and your target network. For Base Sepolia you can set `RPC_URL=https://sepolia.base.org` (or use the chain's default).

2. **Deploy the factory** (from `packages/contracts`):

   **Base Sepolia:**
   ```bash
   cd packages/contracts
   forge script script/DeployFactory.s.sol:DeployFactoryScript --rpc-url https://sepolia.base.org --broadcast
   ```

   **Local Anvil:**
   ```bash
   # Terminal 1: start Anvil
   anvil

   # Terminal 2: deploy (use a private key from Anvil's output)
   cd packages/contracts
   forge script script/DeployFactory.s.sol:DeployFactoryScript --rpc-url http://127.0.0.1:8545 --broadcast --private-key <YOUR_ANVIL_PRIVATE_KEY>
   ```

3. **Copy the deployed address** from the script output (`AgentWalletFactory deployed at: 0x...`).

4. **Configure the dashboard** by adding **one** of these to `packages/contracts/.env`:
   ```bash
   NEXT_PUBLIC_FACTORY_ADDRESS=0xYourFactoryAddressHere
   ```
   or:
   ```bash
   FACTORY_ADDRESS=0xYourFactoryAddressHere
   ```
   The dashboard reads from `packages/contracts/.env`; `FACTORY_ADDRESS` is mapped to `NEXT_PUBLIC_FACTORY_ADDRESS` if the latter is not set.

5. **Restart the dashboard** dev server so it picks up the new env (stop and run `pnpm dev` again in `packages/dashboard`).

After that, the "Create wallet" flow in the app will use your factory and the "Factory not configured" message will go away.

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
createdb agentos

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
agentos/
├── packages/
│   ├── contracts/     # Solidity contracts (Foundry)
│   ├── sdk/           # TypeScript SDK (@agentos/sdk)
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
