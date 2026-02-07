import { NextResponse } from 'next/server';
import { hasServerSigner, isReplayRequired } from '@/lib/agent-api/env';

/**
 * GET /api/agent/health — readiness check, no auth.
 * Returns API name, version, server time, and config flags.
 * Cache-Control: no-store to avoid stale CDN/proxy caching.
 */
export async function GET() {
  const data = {
    name: 'AgentOS Agent API',
    version: 'weekend-1',
    now: new Date().toISOString(),
    serverSignerEnabled: hasServerSigner(),
    replayStrict: isReplayRequired(),
  };
  return NextResponse.json({ ok: true as const, data }, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
