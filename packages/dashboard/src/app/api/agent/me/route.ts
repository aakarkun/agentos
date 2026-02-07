import { NextRequest } from 'next/server';
import { withAgentAuth } from '@/lib/agent-api/auth';
import { requireAgent, listLinkedWallets } from '@/lib/agent-api/context';
import { ok, fail, status } from '@/lib/agent-api/response';

/**
 * GET /api/agent/me — Lexa asks "who am I" (agent identity + linked wallets).
 * Auth required.
 */
export async function GET(req: NextRequest) {
  const auth = await withAgentAuth(req);
  if (auth instanceof Response) return auth;
  const { address } = auth;
  try {
    const agent = await requireAgent(address);
    if (agent instanceof Response) return agent;
    const wallets = await listLinkedWallets(agent.id);
    return ok({
      agent: {
        id: agent.id,
        name: agent.name,
        owner_address: agent.owner_address,
        created_at: agent.created_at,
      },
      wallets: wallets.map((w) => ({
        id: w.id,
        wallet_address: w.wallet_address,
        chain_id: w.chain_id,
        label: w.label,
      })),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return fail('INTERNAL_ERROR', e instanceof Error ? e.message : 'unknown', undefined, status.serverError);
  }
}
