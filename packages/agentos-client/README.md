# @agentos/client

Node client for the **AgentOS Agent API** (`/api/agent/*`). Builds the canonical signed message, SHA-256 body hash, signs with the agent wallet, and calls the API. Single integration point for Eliza/Lexa.

## Install

```bash
pnpm add @agentos/client viem
# or
npm i @agentos/client viem
```

## Usage

```ts
import { createAgentOSClient } from '@agentos/client';

const client = createAgentOSClient({
  baseUrl: 'https://your-agentos-dashboard.example.com',
  privateKey: '0x...' as `0x${string}`,
});

// Who am I (agent + linked wallets)
const { agent, wallets } = await client.getMe();

// Log audit event
await client.postAudit({ event_type: 'LEXA_NOTE', message: 'Decision: approved' });

// Create invoice (returns pay_url)
const { invoice, pay_url } = await client.postInvoices({
  to_wallet_address: '0x...',
  chain_id: 84532,
  amount: '1000000000000000',
});

// Propose transfer (submitted if server signer exists, else prepared)
const result = await client.postTransfersPropose({
  wallet_address: '0x...',
  to: '0x...',
  token: '0x0000000000000000000000000000000000000000',
  amount: '1000000000000000',
  context: { reason: 'payment' },
});
```

## Low-level

- **Canonical message:** `buildCanonicalMessage(address, timestamp, path, bodySha256)` — same format as server.
- **Sign:** `signRequest({ baseUrl, path, method, body?, privateKey })` — returns `{ headers, address }`.
- **SHA-256 body:** `sha256Hex(body)` — empty string for GET.

Use `client.request(path, method, body?)` for any `/api/agent/*` path.

## Auth

The client signs every request with:

- `x-agent-address` — agent wallet address
- `x-agent-signature` — signature over canonical message
- `x-agent-timestamp` — unix ms

Server verifies timestamp ±5 min and recovered signer. See `docs/agent-api-example.md` in the repo for the full canonical message format.
