'use client';

import { useEffect, useState } from 'react';
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
import type { Agent } from '@/lib/supabase';

type AgentWallet = { id: string; wallet_address: string; chain_id: number; label: string };

export default function PayPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [wallets, setWallets] = useState<AgentWallet[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<AgentWallet | null>(null);
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [chainId, setChainId] = useState(process.env.NEXT_PUBLIC_CHAIN_ID ?? '31337');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => (r.ok ? r.json() : []))
      .then(setAgents)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAgentId) {
      setWallets([]);
      setSelectedWallet(null);
      return;
    }
    fetch(`/api/agents/${selectedAgentId}/wallets`)
      .then((r) => (r.ok ? r.json() : []))
      .then((w: AgentWallet[]) => {
        setWallets(w);
        setSelectedWallet(w[0] ?? null);
      });
  }, [selectedAgentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedAgentId || !selectedWallet || !amount.trim()) {
      setError('Select an agent, a linked wallet, and enter amount.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgentId,
          to_wallet_address: selectedWallet.wallet_address,
          amount: amount.trim(),
          token_address: tokenAddress.trim() || null,
          chain_id: parseInt(chainId, 10) || 31337,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setCreatedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (createdId) {
    return (
      <Card className="rounded-3xl border-border max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Invoice created</CardTitle>
          <CardDescription>
            Share the pay link or open the receipt after payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="rounded-full w-full" asChild>
            <Link href={`/pay/${createdId}`}>Open pay page</Link>
          </Button>
          <Button variant="outline" className="rounded-full w-full" asChild>
            <Link href={`/receipt/${createdId}`}>View receipt</Link>
          </Button>
          <Button variant="ghost" className="rounded-full w-full" asChild>
            <Link href="/pay">Create another</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="rounded-full" asChild>
          <Link href="/">← Overview</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create invoice</h1>
          <p className="text-sm text-muted-foreground">
            Create an invoice that pays into a governed wallet. Share the pay link for others to pay.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-border max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Invoice details</CardTitle>
          <CardDescription>
            Pick an agent and a linked wallet to receive payment. Amount in wei (ETH) or token units.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Agent</label>
              <select
                className="rounded-full border border-input bg-background px-4 py-2 text-sm"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
              >
                <option value="">Select agent</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            {wallets.length > 0 && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Pay to wallet</label>
                <select
                  className="rounded-full border border-input bg-background px-4 py-2 text-sm"
                  value={selectedWallet?.id ?? ''}
                  onChange={(e) => {
                    const w = wallets.find((x) => x.id === e.target.value);
                    setSelectedWallet(w ?? null);
                  }}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.label} — {w.wallet_address.slice(0, 10)}…</option>
                  ))}
                </select>
              </div>
            )}
            {selectedAgentId && wallets.length === 0 && (
              <p className="text-sm text-amber-600">No linked wallets. Link a wallet on the agent details page.</p>
            )}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Amount</label>
              <Input
                className="rounded-full"
                placeholder="0.01 (ETH wei or token units)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">For ETH use wei (e.g. 10000000000000000 = 0.01 ETH).</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Token address (optional)</label>
              <Input
                className="rounded-full font-mono text-sm"
                placeholder="Leave empty for ETH"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Chain ID</label>
              <Input
                className="rounded-full w-28"
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="rounded-full" disabled={submitting || !selectedAgentId || wallets.length === 0}>
              {submitting ? 'Creating…' : 'Create invoice'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
