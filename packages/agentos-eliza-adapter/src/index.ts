/**
 * @agentos/eliza-adapter — Lexa/Eliza-ready adapter for AgentOS Agent API.
 * Wraps @agentos/client with health (no auth), handshake (auth), me, audit, invoices, transfers.
 * Framework-agnostic; no Eliza imports.
 */

import { AgentOSClient } from '@agentos/client';

export interface LexaAgentOSAdapterConfig {
  baseUrl: string;
  /** EVM private key (0x-prefixed hex). Passed to @agentos/client. */
  agentPrivateKey: string;
}

export interface HealthData {
  name: string;
  version: string;
  now: string;
  serverSignerEnabled: boolean;
  replayStrict: boolean;
}

export interface HandshakeAuth {
  basePath: string;
  headers: string[];
  canonicalMessageTemplate: string;
  timestampSkewSeconds: number;
  replayProtection: {
    enabled: boolean;
    strict: boolean;
    keyFormat: string;
  };
}

export interface HandshakeData {
  agentAddress: string;
  auth: HandshakeAuth;
}

export interface MeData {
  agent: { id: string; name: string; owner_address: string; created_at: string };
  wallets: Array<{ id: string; wallet_address: string; chain_id: number; label: string }>;
}

export interface CreateInvoiceParams {
  to_wallet_address: string;
  chain_id: number;
  amount: string;
  token_address?: string | null;
  memo?: string;
  agent_id?: string;
}

export interface CreateInvoiceResult {
  invoice: unknown;
  pay_url: string;
}

export interface ProposeTransferParams {
  wallet_address: string;
  to: string;
  token: string;
  amount: string;
  context?: Record<string, unknown>;
}

export interface ProposeTransferResult {
  mode: 'submitted' | 'prepared';
  proposalId?: string;
  txHash?: string;
  contractAddress?: string;
  calldata?: string;
  functionName?: string;
  args?: unknown;
  contextHash?: string;
}

/**
 * Creates a Lexa/Eliza-ready adapter for the AgentOS Agent API.
 * - health(): no auth (plain fetch)
 * - handshake(), getMe(), logAudit(), createInvoice(), proposeTransfer(): signed via @agentos/client
 */
export function createLexaAgentOSAdapter(config: LexaAgentOSAdapterConfig) {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const client = new AgentOSClient({
    baseUrl,
    privateKey: config.agentPrivateKey as `0x${string}`,
  });

  const apiPath = (path: string) => {
    const p = path.startsWith('/') ? path : `/${path}`;
    return p.startsWith('/api/agent') ? p : `/api/agent${p}`;
  };

  return {
    /** GET /api/agent/health — no auth */
    async health(): Promise<HealthData> {
      const url = `${baseUrl}${apiPath('/health')}`;
      const res = await fetch(url);
      const json = (await res.json()) as { ok: true; data: HealthData } | { ok: false; error: unknown };
      if (!res.ok || (json && typeof json === 'object' && 'ok' in json && (json as { ok: boolean }).ok === false)) {
        const err = json && typeof json === 'object' && 'error' in json ? (json as { error: { message?: string } }).error : null;
        throw new Error(err?.message ?? `health failed: ${res.status}`);
      }
      return (json as { ok: true; data: HealthData }).data;
    },

    /** GET /api/agent/handshake — signed */
    async handshake(): Promise<HandshakeData> {
      return client.request<HandshakeData>('/handshake', 'GET');
    },

    /** GET /api/agent/me — signed */
    async getMe(): Promise<MeData> {
      return client.getMe();
    },

    /** POST /api/agent/audit — signed */
    async logAudit(params: { event_type: string; message: string; metadata?: Record<string, unknown> }): Promise<{ id: string }> {
      return client.postAudit(params);
    },

    /** POST /api/agent/invoices — signed */
    async createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResult> {
      return client.postInvoices(params);
    },

    /** POST /api/agent/transfers/propose — signed */
    async proposeTransfer(params: ProposeTransferParams): Promise<ProposeTransferResult> {
      return client.postTransfersPropose(params);
    },
  };
}
