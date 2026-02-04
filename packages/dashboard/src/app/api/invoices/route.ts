import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agent_id');
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  let query = supabase
    .from('invoices')
    .select('id, agent_id, to_wallet_address, amount, token_address, chain_id, status, tx_hash, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (agentId) query = query.eq('agent_id', agentId);
  const { data, error } = await query;
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
  const agent_id = body.agent_id as string;
  const to_wallet_address = (body.to_wallet_address as string)?.trim();
  const amount = typeof body.amount === 'string' ? body.amount : String(body.amount ?? '');
  const token_address = (body.token_address as string)?.trim() || null;
  const chain_id = typeof body.chain_id === 'number' ? body.chain_id : parseInt(String(body.chain_id ?? '31337'), 10);
  if (!agent_id || !to_wallet_address || !/^0x[a-fA-F0-9]{40}$/.test(to_wallet_address) || !amount) {
    return NextResponse.json({ error: 'agent_id, to_wallet_address (0x...), and amount required' }, { status: 400 });
  }
  const { data: invoice, error: insertError } = await supabase
    .from('invoices')
    .insert({
      agent_id,
      to_wallet_address,
      amount,
      token_address,
      chain_id,
      status: 'issued',
    })
    .select('id, agent_id, to_wallet_address, amount, token_address, chain_id, status, created_at')
    .single();
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  await supabase.from('audit_logs').insert({
    agent_id,
    type: 'INVOICE_CREATED',
    payload: { invoice_id: invoice.id, to_wallet_address, amount, token_address, chain_id },
  });
  return NextResponse.json(invoice);
}
