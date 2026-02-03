'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { WalletList } from '@/components/WalletList';
import { RoleBanner } from '@/components/RoleBanner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getStoredRole, type Role } from '@/lib/role';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'openwallet-custom-addresses';

export default function WalletsPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [role, setRole] = useState<Role | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const r = getStoredRole();
    setRole(r);
    if (!r) router.replace('/');
  }, [mounted, router]);

  if (!mounted || !role) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const isAgent = role === 'agent';

  return (
    <div className="space-y-6">
      <RoleBanner />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isAgent ? 'My wallets' : 'Wallets I oversee'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAgent
              ? 'Add or create wallets you can spend from. Open one to see balance and limits.'
              : 'Add or create wallets you fund. Open one to set limits and approve transfers. Connect your wallet to take action.'}
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full shrink-0" asChild>
          <Link href="/">Switch role</Link>
        </Button>
      </div>

      {!isConnected && !isAgent && (
        <Card className="rounded-3xl border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Connect your wallet</CardTitle>
            <CardDescription>
              Connect to approve or reject transfers, change limits, or use emergency actions.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isConnected && isAgent && (
        <Card className="rounded-3xl border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Optional: connect wallet</CardTitle>
            <CardDescription>
              You can add and view wallets without connecting. Connect if you also act as the human for a wallet.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="rounded-3xl border-border bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add or create a wallet</CardTitle>
          <CardDescription>
            Create a new wallet from the app (you sign and pay gas), or add one you deployed with Foundry.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          <Button size="sm" className="rounded-full" asChild>
            <Link href="/wallets/create">Create wallet</Link>
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" asChild>
            <Link href="/setup">Deploy with Foundry</Link>
          </Button>
        </CardContent>
      </Card>

      <WalletList storageKey={STORAGE_KEY} />
    </div>
  );
}
