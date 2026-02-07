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
    .from('agents')
    .select('id, name, owner_address, created_at')
    .eq('id', id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 });
  }
  return NextResponse.json(data);
}
