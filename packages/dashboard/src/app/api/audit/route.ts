import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/** POST: append an audit log entry (e.g. WALLET_DEPLOYED, POLICY_UPDATED). */
export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  const body = await request.json();
  const agent_id = body.agent_id as string;
  const type = body.type as string;
  const payload = body.payload as Record<string, unknown> | undefined;
  if (!agent_id || !type) {
    return NextResponse.json({ error: 'agent_id and type required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('audit_logs')
    .insert({ agent_id, type, payload: payload ?? null })
    .select('id, created_at')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
