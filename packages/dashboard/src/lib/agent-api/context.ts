/**
 * Agent context resolution: resolve agent by owner_address (case-insensitive), list linked wallets.
 * We compare using address.toLowerCase(); we never mutate stored addresses and return original stored values.
 */

import { getSupabase } from '@/lib/supabase';
import type { Agent, AgentWalletRow } from '@/lib/supabase';
import { fail, status } from './response';

function normalizeAddress(addr: string): string {
  const s = (addr ?? '').trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(s)) return '';
  return s.toLowerCase();
}

export async function getAgentByOwnerAddress(ownerAddress: string): Promise<Agent | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const normalized = normalizeAddress(ownerAddress);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, owner_address, created_at');
  if (error || !data) return null;
  const row = data.find((r) => (r as Agent).owner_address.toLowerCase() === normalized);
  return row ? (row as Agent) : null;
}

export async function requireAgent(ownerAddress: string): Promise<Agent> {
  const agent = await getAgentByOwnerAddress(ownerAddress);
  if (!agent) {
    throw fail('AGENT_NOT_FOUND', 'no agent found for this address', undefined, status.notFound);
  }
  return agent;
}

export async function listLinkedWallets(agentId: string): Promise<AgentWalletRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('agent_wallets')
    .select('id, agent_id, wallet_address, chain_id, label, created_at')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data ?? []) as AgentWalletRow[];
}

export function isLinkedWallet(wallets: AgentWalletRow[], walletAddress: string): boolean {
  const normalized = normalizeAddress(walletAddress);
  if (!normalized) return false;
  return wallets.some((w) => w.wallet_address.toLowerCase() === normalized);
}
