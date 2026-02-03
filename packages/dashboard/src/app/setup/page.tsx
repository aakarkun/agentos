'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SetupPage() {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = (text: string, step: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(step);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          How to setup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Until we add &quot;Create new wallet&quot; in the app, use this flow to get a wallet and add it to the dashboard.
        </p>
      </div>

      {/* Step 1: Prerequisites */}
      <Card className="rounded-3xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">1. Prerequisites</CardTitle>
          <CardDescription>
            Node.js 18+, pnpm 8+, and Foundry (for deploying the contract).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Install Foundry:</p>
          <pre className="rounded-2xl border border-border bg-muted/50 p-4 font-mono text-xs overflow-x-auto">
            <code>curl -L https://foundry.paradigm.xyz | bash\nfoundryup</code>
          </pre>
          <p>Clone the repo and install dependencies:</p>
          <pre className="rounded-2xl border border-border bg-muted/50 p-4 font-mono text-xs overflow-x-auto">
            <code>pnpm install</code>
          </pre>
        </CardContent>
      </Card>

      {/* Step 2: Deploy wallet */}
      <Card className="rounded-3xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">2. Deploy a wallet</CardTitle>
          <CardDescription>
            Deploy via the Foundry script. You need a private key (deployer), agent address, and human address. Set them in <code className="text-xs rounded bg-muted px-1">.env</code> in the repo root or <code className="text-xs rounded bg-muted px-1">packages/contracts</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Required env: <code className="text-xs rounded bg-muted px-1">PRIVATE_KEY</code>, <code className="text-xs rounded bg-muted px-1">AGENT_ADDRESS</code>, <code className="text-xs rounded bg-muted px-1">HUMAN_ADDRESS</code>, <code className="text-xs rounded bg-muted px-1">RPC_URL</code>.</p>
          <pre className="rounded-2xl border border-border bg-muted/50 p-4 font-mono text-xs overflow-x-auto">
            <code>{`cd packages/contracts
forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast`}</code>
          </pre>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => copy('cd packages/contracts\nforge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast', 2)}
          >
            {copied === 2 ? 'Copied!' : 'Copy command'}
          </Button>
          <p className="text-sm text-muted-foreground">
            The script prints the deployed contract address. Copy it — you&apos;ll add it in the dashboard next.
          </p>
        </CardContent>
      </Card>

      {/* Step 3: Add contract address in dashboard */}
      <Card className="rounded-3xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">3. Add the contract address in the dashboard</CardTitle>
          <CardDescription>
            Go to <strong className="text-foreground">Wallets</strong>, choose &quot;I am an Agent&quot; or &quot;I am a Human&quot; if needed, then add the deployed address. You can give it a friendly name; the contract address is the on-chain address (0x...).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" className="rounded-full" asChild>
            <Link href="/wallets">Open Wallets</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Step 4: Connect wallet (human) */}
      <Card className="rounded-3xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">4. Connect your wallet (for human actions)</CardTitle>
          <CardDescription>
            If you&apos;re the human, connect your wallet in the header. Then open a wallet&apos;s details to approve or reject transfers, set policy, or use emergency actions.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Coming: Create new wallet */}
      <Card className="rounded-3xl border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Coming: Create new wallet from the app</CardTitle>
          <CardDescription>
            We&apos;re adding a &quot;Create wallet&quot; flow in the dashboard (Phase 1.5 — Factory) so you won&apos;t need to run the deploy script. Until then, use the steps above.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
