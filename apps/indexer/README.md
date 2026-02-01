# OpenWallet Indexer

Thin event indexer for OpenWallet - Node worker + Postgres.

## Setup

1. Create a Postgres database:
```bash
createdb openwallet
```

2. Run migrations:
```bash
pnpm migrate
```

3. Set environment variables:
```bash
export DATABASE_URL=postgresql://localhost/openwallet
export RPC_URL=https://sepolia.base.org
export CHAIN_ID=84532
export WALLET_ADDRESSES=0x...,0x...
```

4. Start the indexer:
```bash
pnpm start
```

## Database Schema

- `proposals` - Transfer proposals
- `events` - All contract events
- `indexer_state` - Last indexed block

## Features

- Indexes events from AgentWallet contracts
- Stores proposals and events in Postgres
- Tracks last indexed block
- Handles reorgs (can be extended)
