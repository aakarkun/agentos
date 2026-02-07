/**
 * Supabase server client for AgentOS Agent Registry + Audit + Invoices.
 * Use only in server components / API routes (env vars are server-only).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = (process.env.SUPABASE_URL ?? '').trim();
  const key = (process.env.SUPABASE_ANON_KEY ?? '').trim();
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}

export type Agent = {
  id: string;
  name: string;
  owner_address: string;
  created_at: string;
};

export type AgentWalletRow = {
  id: string;
  agent_id: string;
  wallet_address: string;
  chain_id: number;
  label: string;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  agent_id: string;
  type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};
