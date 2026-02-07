'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Agent } from '@/lib/supabase';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then(setAgents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading agents…</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-3xl border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/">Back to Overview</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lightweight agent profiles linked to governed wallets.
          </p>
        </div>
        <Button className="rounded-full" asChild>
          <Link href="/agents/new">Create agent</Link>
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="rounded-3xl border-border">
          <CardHeader>
            <CardTitle className="text-base">No agents yet</CardTitle>
            <CardDescription>
              Create an agent to link governed wallets and see audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="rounded-full" asChild>
              <Link href="/agents/new">Create agent</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="rounded-3xl border-border hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <CardDescription className="font-mono text-xs break-all">
                  Owner: {agent.owner_address}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="rounded-full w-full" asChild>
                  <Link href={`/agents/${agent.id}`}>View details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
