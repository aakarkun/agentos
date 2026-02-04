import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  const { data, error } = await supabase
    .from('agent_wallets')
    .select('id, agent_id, wallet_address, chain_id, label, created_at')
    .eq('agent_id', id)
    .order('created_at', { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  const body = await request.json();
  const wallet_address = typeof body.wallet_address === 'string' ? body.wallet_address.trim() : '';
  const chain_id = typeof body.chain_id === 'number' ? body.chain_id : Number(body.chain_id);
  const label = typeof body.label === 'string' ? body.label.trim() || 'Main' : 'Main';
  if (!wallet_address || !/^0x[a-fA-F0-9]{40}$/.test(wallet_address) || !Number.isInteger(chain_id)) {
    return NextResponse.json({ error: 'wallet_address (0x...) and chain_id (integer) required' }, { status: 400 });
  }
  const { data: row, error: insertError } = await supabase
    .from('agent_wallets')
    .insert({ agent_id: agentId, wallet_address, chain_id, label })
    .select('id, agent_id, wallet_address, chain_id, label, created_at')
    .single();
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  await supabase.from('audit_logs').insert({
    agent_id: agentId,
    type: 'WALLET_LINKED',
    payload: { wallet_address, chain_id, label },
  });
  return NextResponse.json(row);
}
