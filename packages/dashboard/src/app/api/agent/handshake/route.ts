import { NextRequest } from 'next/server';
import { withAgentAuth } from '@/lib/agent-api/auth';
import { ok } from '@/lib/agent-api/response';
import { isReplayRequired } from '@/lib/agent-api/env';

const TIMESTAMP_SKEW_SECONDS = 300; // ±5 minutes

/**
 * GET /api/agent/handshake — auth required; returns agent address and auth spec for clients.
 */
export async function GET(req: NextRequest) {
  const auth = await withAgentAuth(req);
  if (auth instanceof Response) return auth;
  const { address } = auth;

  return ok({
    agentAddress: req.headers.get('x-agent-address') ?? address,
    auth: {
      basePath: '/api/agent',
      headers: ['x-agent-address', 'x-agent-signature', 'x-agent-timestamp'],
      canonicalMessageTemplate:
        'AgentOS Agent API\naddress=<address>\ntimestamp=<timestamp>\npath=<pathname>\nbodySha256=<sha256>',
      timestampSkewSeconds: TIMESTAMP_SKEW_SECONDS,
      replayProtection: {
        enabled: true,
        strict: isReplayRequired(),
        keyFormat: 'address:timestamp:method:path:bodySha256',
      },
    },
  });
}
