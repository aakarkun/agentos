/**
 * Signed-message auth for Agent API. Lexa/agents send x-agent-address, x-agent-signature, x-agent-timestamp.
 * Canonical message includes path and bodySha256; server verifies timestamp ±5 min, recovered signer, and replay (nonce table).
 * Replay key includes method so GET vs POST cannot collide. Optional AGENTOS_REPLAY_REQUIRED=1 strict mode: if replay insert fails (other than duplicate 23505), auth fails with 401 replay_check_unavailable.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { sha256Hex } from './crypto';
import { getSupabase } from '@/lib/supabase';
import { isReplayRequired } from './env';

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // ±5 minutes

function buildCanonicalMessage(address: string, timestamp: string, pathname: string, bodySha256: string): string {
  return `AgentOS Agent API\naddress=${address}\ntimestamp=${timestamp}\npath=${pathname}\nbodySha256=${bodySha256}`;
}

function buildReplayKey(params: {
  address: string;
  timestampRaw: string;
  method: string;
  pathname: string;
  bodySha256: string;
}): string {
  const { address, timestampRaw, method, pathname, bodySha256 } = params;
  return `${address.toLowerCase()}:${timestampRaw}:${method.toUpperCase()}:${pathname}:${bodySha256.toLowerCase()}`;
}

export async function verifyAgentRequest(
  req: NextRequest,
  bodyText: string
): Promise<{ ok: true; address: string } | { ok: false; reason: string }> {
  const address = (req.headers.get('x-agent-address') ?? '').trim();
  const signature = (req.headers.get('x-agent-signature') ?? '').trim();
  const timestampRaw = (req.headers.get('x-agent-timestamp') ?? '').trim();

  if (!address || !signature || !timestampRaw) {
    return { ok: false, reason: 'missing x-agent-address, x-agent-signature, or x-agent-timestamp' };
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { ok: false, reason: 'invalid x-agent-address' };
  }

  const timestampMs = parseInt(timestampRaw, 10);
  if (!Number.isFinite(timestampMs)) {
    return { ok: false, reason: 'invalid x-agent-timestamp' };
  }

  const now = Date.now();
  if (Math.abs(now - timestampMs) > TIMESTAMP_TOLERANCE_MS) {
    return { ok: false, reason: 'timestamp out of window' };
  }

  // GET has no body: bodyText is '' and bodySha256 is sha256 of empty string
  const bodySha256 = await sha256Hex(bodyText);
  const pathname = req.nextUrl.pathname;
  const message = buildCanonicalMessage(address, timestampRaw, pathname, bodySha256);

  try {
    const recovered = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!recovered) {
      return { ok: false, reason: 'signature verification failed' };
    }
  } catch {
    return { ok: false, reason: 'signature verification failed' };
  }

  const key = buildReplayKey({
    address: address.toLowerCase(),
    timestampRaw,
    method: req.method,
    pathname,
    bodySha256: bodySha256.toLowerCase(),
  });
  const supabase = getSupabase();
  const strictReplay = isReplayRequired();
  if (supabase) {
    const { error } = await supabase.from('agent_request_nonces').insert({ request_key: key });
    if (error) {
      if (error.code === '23505') {
        return { ok: false, reason: 'replay' };
      }
      if (strictReplay) {
        return { ok: false, reason: 'replay_check_unavailable' };
      }
    }
  } else if (strictReplay) {
    return { ok: false, reason: 'replay_check_unavailable' };
  }

  return { ok: true, address: address.toLowerCase() };
}

/** Read body, verify signed headers; returns { address, bodyText } or a 401 NextResponse. */
export async function withAgentAuth(
  req: NextRequest
): Promise<{ address: string; bodyText: string } | NextResponse> {
  const bodyText = await req.text();
  const result = await verifyAgentRequest(req, bodyText);
  if (!result.ok) {
    const { fail: failResponse, status: st } = await import('./response');
    return failResponse('UNAUTHORIZED', result.reason, undefined, st.unauthorized);
  }
  return { address: result.address, bodyText };
}
