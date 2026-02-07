-- AgentOS Weekend 1: Agent Registry Lite + Audit
-- Run in Supabase SQL Editor or via Supabase CLI.
-- Idempotent: safe to re-run (IF NOT EXISTS).

-- Agents: lightweight agent profiles
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Agent wallets: linked governed wallets (AgentWallet contract address + chain)
CREATE TABLE IF NOT EXISTS agent_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  chain_id int NOT NULL,
  label text NOT NULL DEFAULT 'Main',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, wallet_address, chain_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_wallets_agent_id ON agent_wallets(agent_id);

-- Audit logs: events per agent
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_agent_id ON audit_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
