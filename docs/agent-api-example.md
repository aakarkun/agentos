# AgentOS Agent API — Example for Eliza/Lexa

Minimal guide to call `/api/agent/*` with **signed message auth**.

**Node client (Eliza integration):** Use `@agentos/client` in this repo (`packages/agentos-client`). It builds the canonical message, SHA-256 body, signs with the agent wallet, and calls `/api/agent/*`. See `packages/agentos-client/README.md`.

---

## Quick test (Node)

Use `@agentos/client` for signed calls. Health is unauthenticated.

```ts
const BASE = 'http://localhost:3000'; // or your dashboard URL

// 1. GET /api/agent/health — no auth
const healthRes = await fetch(`${BASE}/api/agent/health`);
const health = await healthRes.json();
console.log(health); // { ok: true, data: { name, version, now, serverSignerEnabled, replayStrict } }

// 2. Signed: handshake + me (use @agentos/client)
import { createAgentOSClient } from '@agentos/client';

const client = createAgentOSClient({ baseUrl: BASE, privateKey: '0x...' as `0x${string}` });
const handshakeData = await client.request('/handshake', 'GET');
const meData = await client.getMe();
console.log(handshakeData, meData);
```

## Auth: canonical message + headers

Every request must send:

- `x-agent-address`: EVM address (0x...)
- `x-agent-signature`: signature over the canonical message
- `x-agent-timestamp`: unix time in **milliseconds**

**Canonical message** (single string, newline-separated):

```
AgentOS Agent API
address=<x-agent-address>
timestamp=<x-agent-timestamp>
path=<request path, e.g. /api/agent/me>
bodySha256=<sha256 hex of request body; empty body => sha256("")>
```

- `path` = URL pathname (e.g. `/api/agent/me`, `/api/agent/audit`).
- `bodySha256` = SHA-256 of the **raw request body** as UTF-8, hex-encoded. For GET or empty body, use SHA-256 of empty string: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

Server checks:

- Timestamp within ±5 minutes of server time
- Recovered signer equals `x-agent-address`
- `bodySha256` matches request body
- Replay guard: same (address, timestamp, path, bodySha256) cannot be used twice (Supabase `agent_request_nonces` table). Replay → 401 "replay"

---

## Signing in Node (viem)

```ts
import { createWalletClient, http, privateKeyToAccount } from 'viem';
import { signMessage } from 'viem/actions';
import { sha256 } from 'viem/utils'; // or your sha256 helper

const account = privateKeyToAccount('0x...' as `0x${string}`);
const body = JSON.stringify({ event_type: 'LEXA_NOTE', message: 'Hello' });
const bodySha256 = await sha256(new TextEncoder().encode(body)).then((b) => Buffer.from(b).toString('hex'));
const path = '/api/agent/audit';
const timestamp = String(Date.now());
const address = account.address;
const message = `AgentOS Agent API\naddress=${address}\ntimestamp=${timestamp}\npath=${path}\nbodySha256=${bodySha256}`;
const signature = await signMessage({ account, message });
// Headers: x-agent-address, x-agent-signature, x-agent-timestamp
```

Note: `viem/utils` may not export `sha256`; use Node `crypto.subtle.digest('SHA-256', ...)` or a small helper that returns hex.

---

## Example: SHA-256 of body (Node)

```ts
import { createHash } from 'crypto';
function bodySha256Hex(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex');
}
```

---

## Example: curl (after signing elsewhere)

Replace `SIGNATURE`, `TIMESTAMP`, `ADDRESS`, and `BODY_SHA256` with values from your signer.

```bash
# GET /api/agent/me (empty body => bodySha256 = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855)
curl -X GET "https://your-dashboard.example/api/agent/me" \
  -H "x-agent-address: 0xYourAddress" \
  -H "x-agent-signature: 0x..." \
  -H "x-agent-timestamp: 1738678900123"
```

```bash
# POST /api/agent/audit
curl -X POST "https://your-dashboard.example/api/agent/audit" \
  -H "Content-Type: application/json" \
  -H "x-agent-address: 0xYourAddress" \
  -H "x-agent-signature: 0x..." \
  -H "x-agent-timestamp: 1738678900123" \
  -d '{"event_type":"LEXA_NOTE","message":"Decision: approved","metadata":{"source":"lexa"}}'
```

```bash
# POST /api/agent/invoices
curl -X POST "https://your-dashboard.example/api/agent/invoices" \
  -H "Content-Type: application/json" \
  -H "x-agent-address: 0xYourAddress" \
  -H "x-agent-signature: 0x..." \
  -H "x-agent-timestamp: 1738678900123" \
  -d '{"to_wallet_address":"0xGovernedWallet","chain_id":84532,"amount":"1000000000000000","memo":"Invoice #1"}'
```

```bash
# POST /api/agent/transfers/propose
curl -X POST "https://your-dashboard.example/api/agent/transfers/propose" \
  -H "Content-Type: application/json" \
  -H "x-agent-address: 0xYourAddress" \
  -H "x-agent-signature: 0x..." \
  -H "x-agent-timestamp: 1738678900123" \
  -d '{"wallet_address":"0xAgentWallet","to":"0xRecipient","token":"0x0000000000000000000000000000000000000000","amount":"1000000000000000","context":{"reason":"payment"}}'
```

---

## Response envelope

All endpoints return JSON:

- Success: `{ "ok": true, "data": <payload> }` (HTTP 200)
- Error: `{ "ok": false, "error": { "code": "...", "message": "...", "details": ... } }` (HTTP 400/401/404/500)

---

## Invoice status (canonical)

Agent-created invoices use the same status set as the dashboard:

- **issued** — unpaid, waiting for payment (pay page accepts this)
- **paid** — paid
- **void** — cancelled

The public pay page expects `status === 'issued'` to show the pay form. Do not use `pending`; use **issued** for unpaid.

---

## OpenAPI

`GET /api/agent/openapi` returns a minimal OpenAPI 3.0 JSON for these endpoints and auth.
