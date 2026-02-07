# @agentos/eliza-adapter

Lexa/Eliza-ready adapter for the AgentOS Agent API. Wraps `@agentos/client` with a small API suited for integration checks and agent workflows.

**No new dependencies** — depends only on `@agentos/client` (same repo).

## API

```ts
import { createLexaAgentOSAdapter } from '@agentos/eliza-adapter';

const adapter = createLexaAgentOSAdapter({
  baseUrl: 'https://your-dashboard.example',
  agentPrivateKey: '0x...' as `0x${string}`,
});

// No auth
const health = await adapter.health();

// Signed (uses @agentos/client)
const handshake = await adapter.handshake();
const me = await adapter.getMe();
await adapter.logAudit({ event_type: 'LEXA_NOTE', message: 'Hello' });
const { pay_url } = await adapter.createInvoice({ to_wallet_address: '0x...', chain_id: 84532, amount: '1000000' });
await adapter.proposeTransfer({ wallet_address: '0x...', to: '0x...', token: '0x...', amount: '1000' });
```

## Methods

| Method | Auth | Endpoint |
|--------|------|----------|
| `health()` | No | GET /api/agent/health |
| `handshake()` | Yes | GET /api/agent/handshake |
| `getMe()` | Yes | GET /api/agent/me |
| `logAudit(params)` | Yes | POST /api/agent/audit |
| `createInvoice(params)` | Yes | POST /api/agent/invoices |
| `proposeTransfer(params)` | Yes | POST /api/agent/transfers/propose |

Framework-agnostic; no Eliza/Lexa runtime imports.
