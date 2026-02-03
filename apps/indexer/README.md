# OpenWallet Indexer

Thin event indexer for OpenWallet - Node worker + Postgres.

## Prerequisites

- **Postgres** must be running (e.g. `brew services start postgresql@14` or Docker).

## Setup

1. Create a Postgres database:
```bash
createdb openwallet
```

2. Run migrations (from repo root or `apps/indexer`):
```bash
cd apps/indexer && pnpm migrate
```

3. Set environment variables (e.g. in `.env`):
```bash
DATABASE_URL=postgresql://localhost/openwallet
RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
WALLET_ADDRESSES=0x...,0x...
START_BLOCK=0   # optional, start from block 0 or a specific block
```

4. Start the indexer:
```bash
pnpm start
```

If migration fails with `ECONNREFUSED`, start Postgres first.

## Database Schema

- `proposals` - Transfer proposals
- `events` - All contract events
- `indexer_state` - Last indexed block

## Features

- Indexes events from AgentWallet contracts
- Stores proposals and events in Postgres
- Tracks last indexed block
- Handles reorgs (can be extended)
