'use client';

import { useRouter } from 'next/navigation';
import { IconWallet, IconSend, IconUsers } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { setStoredRole } from '@/lib/role';
import { cn } from '@/lib/utils';

function IconAgent({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function IconHuman({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

export function Landing() {
  const router = useRouter();

  const enterAs = (role: 'agent' | 'human') => {
    setStoredRole(role);
    router.push('/wallets');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-16 py-8 md:py-16">
      {/* Hero: branding + I am Agent / I am Human in main hero */}
      <section className="text-center space-y-6 md:space-y-8">
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 text-primary">
          <IconWallet className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          AgentOS
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A shared wallet: <strong className="text-foreground">the agent spends</strong> (within limits), <strong className="text-foreground">the human funds and approves.</strong>
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Choose how you're using AgentOS — the rest of the app will show you only what you need.
        </p>

        {/* Role selector - plain language */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 max-w-2xl mx-auto pt-2">
          <Card
            className="rounded-3xl border-2 border-border bg-card hover:border-primary/50 hover:bg-card transition-all cursor-pointer group"
            onClick={() => enterAs('agent')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), enterAs('agent'))}
            role="button"
            tabIndex={0}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <IconAgent />
              </div>
              <CardTitle className="text-xl mt-2">I'm the Agent</CardTitle>
              <CardDescription>
                I spend from a budget. I'll see my wallets and limits here.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                className="w-full rounded-full"
                size="lg"
                onClick={(e) => { e.stopPropagation(); enterAs('agent'); }}
              >
                Continue as Agent
              </Button>
            </CardContent>
          </Card>
          <Card
            className="rounded-3xl border-2 border-border bg-card hover:border-primary/50 hover:bg-card transition-all cursor-pointer group"
            onClick={() => enterAs('human')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), enterAs('human'))}
            role="button"
            tabIndex={0}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <IconHuman />
              </div>
              <CardTitle className="text-xl mt-2">I'm the Human</CardTitle>
              <CardDescription>
                I put money in and approve spends. I'll set limits and approve or reject transfers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                className="w-full rounded-full"
                variant="secondary"
                size="lg"
                onClick={(e) => { e.stopPropagation(); enterAs('human'); }}
              >
                Continue as Human
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What each role does (below hero) */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-border bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <IconSend className="h-6 w-6" />
              <CardTitle className="text-lg">Agent</CardTitle>
            </div>
            <CardDescription>Spends from the wallet within limits you set.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Sees wallets and spending limits</li>
              <li>Proposes and executes transfers (small ones without approval)</li>
              <li>Transfers above a threshold need human approval first</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <IconUsers className="h-6 w-6" />
              <CardTitle className="text-lg">Human</CardTitle>
            </div>
            <CardDescription>Funds the wallet and decides what the agent can spend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Puts money in the wallet</li>
              <li>Sets limits (max per tx, daily cap, approval threshold)</li>
              <li>Approves or rejects transfers above the threshold</li>
              <li>Can pause the agent or withdraw in an emergency</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
