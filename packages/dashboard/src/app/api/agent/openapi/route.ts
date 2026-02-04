import { NextResponse } from 'next/server';

const envelopeSchema = {
  oneOf: [
    { type: 'object' as const, properties: { ok: { const: true }, data: {} }, required: ['ok', 'data'] },
    { type: 'object' as const, properties: { ok: { const: false }, error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, details: {} } } }, required: ['ok', 'error'] },
  ],
};

/**
 * GET /api/agent/openapi — Lightweight OpenAPI JSON for the 4 Agent API endpoints + auth + response envelope.
 */
export async function GET() {
  const paths: Record<string, unknown> = {
    '/me': {
      get: {
        summary: 'Who am I',
        description: 'Returns agent identity + linked wallets. Auth required.',
        operationId: 'getMe',
        security: [{ agentSigned: [] }],
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: envelopeSchema } } },
          '401': { description: 'Auth error' },
        },
      },
    },
    '/audit': {
      post: {
        summary: 'Log audit event',
        description: 'Lexa logs events (LEXA_NOTE, PAYMENT_INTENT, POLICY_CHECK, etc.). Auth required.',
        operationId: 'postAudit',
        security: [{ agentSigned: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['event_type', 'message'],
                properties: { event_type: { type: 'string' }, message: { type: 'string' }, metadata: { type: 'object' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Created audit row id' }, '400': { description: 'Validation error' }, '401': { description: 'Auth error' } },
      },
    },
    '/invoices': {
      post: {
        summary: 'Create invoice',
        description: 'Creates an invoice for a linked governed wallet. Returns invoice + pay_url. Auth required.',
        operationId: 'postInvoices',
        security: [{ agentSigned: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to_wallet_address', 'chain_id', 'amount'],
                properties: {
                  agent_id: { type: 'string', format: 'uuid' },
                  to_wallet_address: { type: 'string' },
                  chain_id: { type: 'integer' },
                  token_address: { type: 'string', nullable: true },
                  amount: { type: 'string' },
                  memo: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'invoice + pay_url' }, '400': { description: 'Validation error' }, '401': { description: 'Auth error' } },
      },
    },
    '/transfers/propose': {
      post: {
        summary: 'Propose transfer',
        description: 'Creates a governed-wallet proposal (AgentWallet). With server signer: mode=submitted. Else: mode=prepared (calldata for client). Auth required.',
        operationId: 'postTransfersPropose',
        security: [{ agentSigned: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['wallet_address', 'to', 'token', 'amount'],
                properties: {
                  wallet_address: { type: 'string' },
                  to: { type: 'string' },
                  token: { type: 'string' },
                  amount: { type: 'string' },
                  context: { type: 'object' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'mode: submitted | prepared' }, '400': { description: 'Validation error' }, '401': { description: 'Auth error' } },
      },
    },
  };

  const doc = {
    openapi: '3.0.0',
    info: { title: 'AgentOS Agent API', version: '1.0.0', description: 'Agent-facing API for Lexa/agents. Auth via signed message headers.' },
    servers: [{ url: '/api/agent', description: 'Agent API base' }],
    security: [{ agentSigned: [] }],
    components: {
      securitySchemes: {
        agentSigned: {
          type: 'apiKey',
          in: 'header',
          name: 'x-agent-address',
          description: 'Signed message auth: x-agent-address, x-agent-signature, x-agent-timestamp. Canonical message: AgentOS Agent API\\naddress=<address>\\ntimestamp=<timestamp>\\npath=<pathname>\\nbodySha256=<sha256 of body>',
        },
      },
      schemas: { AgentApiEnvelope: envelopeSchema },
    },
    paths,
  };

  return NextResponse.json(doc);
}
