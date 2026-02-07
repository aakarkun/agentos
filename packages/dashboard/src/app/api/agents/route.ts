import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, owner_address, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const owner_address = typeof body.owner_address === 'string' ? body.owner_address.trim() : '';
  if (!name || !owner_address || !/^0x[a-fA-F0-9]{40}$/.test(owner_address)) {
    return NextResponse.json({ error: 'name and valid owner_address required' }, { status: 400 });
  }
  const { data: agent, error: insertError } = await supabase
    .from('agents')
    .insert({ name, owner_address })
    .select('id, name, owner_address, created_at')
    .single();
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  // Audit: AGENT_CREATED
  await supabase.from('audit_logs').insert({
    agent_id: agent.id,
    type: 'AGENT_CREATED',
    payload: { name, owner_address },
  });
  return NextResponse.json(agent);
}
