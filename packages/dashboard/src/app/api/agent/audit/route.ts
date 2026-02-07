import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAgentAuth } from '@/lib/agent-api/auth';
import { requireAgent } from '@/lib/agent-api/context';
import { getSupabase } from '@/lib/supabase';
import { ok, fail, status } from '@/lib/agent-api/response';

const bodySchema = z.object({
  event_type: z.string().min(1),
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * POST /api/agent/audit — Lexa logs events (conversation decisions, tool calls, approvals).
 * Auth required.
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
  const { event_type, message, metadata } = parsed.data;
  try {
    const agent = await requireAgent(address);
    if (agent instanceof Response) return agent;
    const supabase = getSupabase();
    if (!supabase) {
      return fail('SERVICE_UNAVAILABLE', 'database not configured', undefined, status.serverError);
    }
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        agent_id: agent.id,
        type: event_type,
        payload: { message, ...(metadata && { metadata }) },
      })
      .select('id')
      .single();
    if (error) {
      return fail('DB_ERROR', error.message, undefined, status.serverError);
    }
    return ok({ id: data.id });
  } catch (e) {
    if (e instanceof Response) return e;
    return fail('INTERNAL_ERROR', e instanceof Error ? e.message : 'unknown', undefined, status.serverError);
  }
}
