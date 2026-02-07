'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NewAgentPage() {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();
  const [name, setName] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connectedAddress) setOwnerAddress((prev) => (prev === '' ? connectedAddress : prev));
  }, [connectedAddress]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    const o = ownerAddress.trim();
    if (!n || !o || !/^0x[a-fA-F0-9]{40}$/.test(o)) {
      setError('Name and a valid owner address (0x...) are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, owner_address: o }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      router.push(`/agents/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="rounded-full" asChild>
          <Link href="/agents">← Agents</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create agent</h1>
      </div>

      <Card className="rounded-3xl border-border">
        <CardHeader>
          <CardTitle className="text-base">Agent profile</CardTitle>
          <CardDescription>
            Give the agent a name and the owner address (who can manage this agent and its wallets).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input
                className="rounded-full"
                placeholder="e.g. Billing Agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Owner address</label>
              <Input
                className="rounded-full font-mono text-sm"
                placeholder="0x..."
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Connect your wallet to auto-fill. This address can manage the agent and linked wallets.
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="rounded-full" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create agent'}
              </Button>
              <Button type="button" variant="outline" className="rounded-full" asChild>
                <Link href="/agents">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
