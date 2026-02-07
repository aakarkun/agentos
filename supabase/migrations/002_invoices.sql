-- AgentOS Weekend 1: AgentPay Lite — Invoices
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_wallet_address text NOT NULL,
  amount text NOT NULL,
  token_address text,
  chain_id int NOT NULL,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'void')),
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_agent_id ON invoices(agent_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
