'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Agent, AgentWalletRow, AuditLogRow } from '@/lib/supabase';

const chainIdToLabel: Record<number, string> = {
  31337: 'Local',
  84532: 'Base Sepolia',
  8453: 'Base',
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [wallets, setWallets] = useState<AgentWalletRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkWalletAddress, setLinkWalletAddress] = useState('');
  const [linkChainId, setLinkChainId] = useState(process.env.NEXT_PUBLIC_CHAIN_ID ? String(process.env.NEXT_PUBLIC_CHAIN_ID) : '31337');
  const [linkLabel, setLinkLabel] = useState('Main');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/agents/${id}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Agent not found')))),
      fetch(`/api/agents/${id}/wallets`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/agents/${id}/audit`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([a, w, logs]) => {
        setAgent(a);
        setWallets(w);
        setAuditLogs(logs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const linkWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    const addr = linkWalletAddress.trim();
    const cid = parseInt(linkChainId, 10);
    if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr) || !Number.isInteger(cid)) {
      setLinkError('Valid wallet address (0x...) and chain ID required.');
      return;
    }
    setLinking(true);
    try {
      const res = await fetch(`/api/agents/${id}/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: addr, chain_id: cid, label: linkLabel.trim() || 'Main' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setWallets((prev) => [...prev, data]);
      setLinkWalletAddress('');
      setLinkLabel('Main');
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : 'Failed to link wallet');
    } finally {
      setLinking(false);
    }
  };

  if (loading || !agent) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">{loading ? 'Loading…' : error ?? 'Not found'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-3xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/agents">← Agents</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="rounded-full" asChild>
          <Link href="/agents">← Agents</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{agent.name}</h1>
          <p className="text-sm text-muted-foreground font-mono break-all">Owner: {agent.owner_address}</p>
        </div>
      </div>

      {/* Linked wallets */}
      <Card className="rounded-3xl border-border">
        <CardHeader>
          <CardTitle className="text-base">Linked wallets</CardTitle>
          <CardDescription>
            Governed wallets (AgentWallet contracts) linked to this agent. Link an existing one or deploy a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wallets.length > 0 && (
            <ul className="space-y-2">
              {wallets.map((w) => (
                <li key={w.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
                  <div>
                    <span className="font-medium text-foreground">{w.label}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="font-mono text-sm text-muted-foreground">{w.wallet_address.slice(0, 10)}…{w.wallet_address.slice(-8)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{chainIdToLabel[w.chain_id] ?? `Chain ${w.chain_id}`}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full shrink-0" asChild>
                    <Link href={`/wallet/${encodeURIComponent(w.wallet_address)}`}>View wallet</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={linkWallet} className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-3">
            <div className="grid gap-1">
              <label className="text-xs font-medium text-muted-foreground">Wallet address</label>
              <Input
                className="rounded-full font-mono text-sm w-64"
                placeholder="0x..."
                value={linkWalletAddress}
                onChange={(e) => setLinkWalletAddress(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-muted-foreground">Chain ID</label>
              <Input
                className="rounded-full w-24"
                placeholder="31337"
                value={linkChainId}
                onChange={(e) => setLinkChainId(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-muted-foreground">Label</label>
              <Input
                className="rounded-full w-28"
                placeholder="Main"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" className="rounded-full" disabled={linking}>
              {linking ? 'Linking…' : 'Link existing wallet'}
            </Button>
            {linkError && <p className="text-sm text-destructive w-full">{linkError}</p>}
          </form>
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href={`/wallets/create?returnTo=${encodeURIComponent(`/agents/${id}`)}`}>
              Deploy new wallet
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent audit logs */}
      <Card className="rounded-3xl border-border">
        <CardHeader>
          <CardTitle className="text-base">Recent audit logs</CardTitle>
          <CardDescription>
            Events for this agent (created, wallet linked, wallet deployed, policy updated).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            <ul className="space-y-2">
              {auditLogs.slice(0, 20).map((log) => (
                <li key={log.id} className="flex flex-wrap items-baseline gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">{log.type}</span>
                  <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                  {log.payload && Object.keys(log.payload).length > 0 && (
                    <span className="font-mono text-xs text-muted-foreground truncate max-w-md">
                      {JSON.stringify(log.payload)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
