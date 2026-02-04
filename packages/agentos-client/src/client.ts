import type { Hex } from 'viem';
import { signRequest } from './sign';

export type AgentApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export interface AgentOSClientConfig {
  baseUrl: string;
  privateKey: Hex;
}

/**
 * Node client for AgentOS Agent API. Builds canonical message, signs with agent wallet, calls /api/agent/*.
 * Single integration point for Eliza/Lexa.
 */
export class AgentOSClient {
  constructor(private config: AgentOSClientConfig) {}

  private get baseUrl(): string {
    const url = this.config.baseUrl.replace(/\/$/, '');
    return url;
  }

  private apiPath(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    return p.startsWith('/api/agent') ? p : `/api/agent${p}`;
  }

  /**
   * Signed request to any /api/agent/* path. Throws on non-2xx or { ok: false }.
   */
  async request<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
    const apiPath = this.apiPath(path);
    const bodyText = method === 'POST' && body !== undefined ? JSON.stringify(body) : '';
    const { headers } = await signRequest({
      baseUrl: this.baseUrl,
      path: apiPath,
      method,
      body: bodyText,
      privateKey: this.config.privateKey,
    });

    const url = `${this.baseUrl}${apiPath}`;
    const res = await fetch(url, {
      method,
      headers: {
        ...headers,
        ...(method === 'POST' && body !== undefined && { 'Content-Type': 'application/json' }),
      },
      ...(method === 'POST' && bodyText && { body: bodyText }),
    });

    const json = (await res.json()) as AgentApiResponse<T>;
    if (!res.ok) {
      const err = json && typeof json === 'object' && 'error' in json ? (json as { ok: false; error: { code: string; message: string } }).error : { code: 'HTTP_ERROR', message: res.statusText };
      throw new Error(err?.message ?? res.statusText);
    }
    if (json && typeof json === 'object' && 'ok' in json && (json as { ok: boolean }).ok === false) {
      const err = (json as { ok: false; error: { code: string; message: string } }).error;
      throw new Error(err?.message ?? err?.code ?? 'API error');
    }
    return (json as { ok: true; data: T }).data;
  }

  /** GET /api/agent/me — agent identity + linked wallets */
  async getMe(): Promise<{ agent: { id: string; name: string; owner_address: string; created_at: string }; wallets: Array<{ id: string; wallet_address: string; chain_id: number; label: string }> }> {
    return this.request('/me', 'GET');
  }

  /** POST /api/agent/audit — log event */
  async postAudit(body: { event_type: string; message: string; metadata?: Record<string, unknown> }): Promise<{ id: string }> {
    return this.request('/audit', 'POST', body);
  }

  /** POST /api/agent/invoices — create invoice, returns invoice + pay_url */
  async postInvoices(body: {
    to_wallet_address: string;
    chain_id: number;
    amount: string;
    token_address?: string | null;
    memo?: string;
    agent_id?: string;
  }): Promise<{ invoice: unknown; pay_url: string }> {
    return this.request('/invoices', 'POST', body);
  }

  /** POST /api/agent/transfers/propose — propose transfer (submitted or prepared) */
  async postTransfersPropose(body: {
    wallet_address: string;
    to: string;
    token: string;
    amount: string;
    context?: Record<string, unknown>;
  }): Promise<{ mode: 'submitted' | 'prepared'; proposalId?: string; txHash?: string; contractAddress?: string; calldata?: string; functionName?: string; args?: unknown; contextHash?: string }> {
    return this.request('/transfers/propose', 'POST', body);
  }
}

export function createAgentOSClient(config: AgentOSClientConfig): AgentOSClient {
  return new AgentOSClient(config);
}
