import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAgentAuth } from '@/lib/agent-api/auth';
import { requireAgent, listLinkedWallets, isLinkedWallet } from '@/lib/agent-api/context';
import { getSupabase } from '@/lib/supabase';
import { getPublicOrigin } from '@/lib/agent-api/origin';
import { ok, fail, status } from '@/lib/agent-api/response';

const bodySchema = z.object({
  agent_id: z.string().uuid().optional(),
  to_wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chain_id: z.number().int(),
  token_address: z.string().nullable().optional(),
  amount: z.string().min(1),
  memo: z.string().optional(),
});

/**
 * POST /api/agent/invoices — Lexa creates an invoice for the agent's linked governed wallet.
 * Auth required. to_wallet_address must be one of the agent's linked wallets.
 */
export async function POST(req: NextRequest) {
  const auth = await withAgentAuth(req);
  if (auth instanceof Response) return auth;
  const { address, bodyText } = auth;
  let body: unknown = {};
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    return fail('VALIDATION_ERROR', 'invalid JSON body', undefined, status.badRequest);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'invalid body', parsed.error.flatten(), status.badRequest);
  }
  const { agent_id: bodyAgentId, to_wallet_address, chain_id, token_address, amount, memo } = parsed.data;
  try {
    const agent = await requireAgent(address);
    if (agent instanceof Response) return agent;
    if (bodyAgentId && bodyAgentId !== agent.id) {
      return fail('FORBIDDEN', 'agent_id does not match authenticated agent', undefined, status.badRequest);
    }
    const wallets = await listLinkedWallets(agent.id);
    if (!isLinkedWallet(wallets, to_wallet_address)) {
      return fail('VALIDATION_ERROR', 'to_wallet_address must be a linked wallet for this agent', undefined, status.badRequest);
    }
    const supabase = getSupabase();
    if (!supabase) {
      return fail('SERVICE_UNAVAILABLE', 'database not configured', undefined, status.serverError);
    }
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        agent_id: agent.id,
        to_wallet_address,
        amount,
        token_address: token_address ?? null,
        chain_id,
        status: 'issued',
      })
      .select('id, agent_id, to_wallet_address, amount, token_address, chain_id, status, created_at')
      .single();
    if (error) {
      return fail('DB_ERROR', error.message, undefined, status.serverError);
    }
    const origin = getPublicOrigin(req);
    const pay_url = `${origin}/pay/${invoice.id}`;
    return ok({ invoice, pay_url });
  } catch (e) {
    if (e instanceof Response) return e;
    return fail('INTERNAL_ERROR', e instanceof Error ? e.message : 'unknown', undefined, status.serverError);
  }
}
