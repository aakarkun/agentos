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
    .from('invoices')
    .select('id, agent_id, to_wallet_address, amount, token_address, chain_id, status, tx_hash, created_at')
    .eq('id', id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  const body = await request.json();
  const status = body.status as string | undefined;
  const tx_hash = (body.tx_hash as string)?.trim() || undefined;
  const updates: Record<string, unknown> = {};
  if (status === 'paid' || status === 'void') updates.status = status;
  if (tx_hash) updates.tx_hash = tx_hash;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'status or tx_hash required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select('id, agent_id, status, tx_hash')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (status === 'paid' && data?.agent_id) {
    await supabase.from('audit_logs').insert([
      { agent_id: data.agent_id, type: 'PAYMENT_SENT', payload: { invoice_id: id, tx_hash } },
      { agent_id: data.agent_id, type: 'INVOICE_PAID', payload: { invoice_id: id, tx_hash } },
    ]);
  }
  return NextResponse.json(data);
}
