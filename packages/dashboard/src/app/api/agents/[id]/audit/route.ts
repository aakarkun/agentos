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
    .from('audit_logs')
    .select('id, agent_id, type, payload, created_at')
    .eq('agent_id', id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
