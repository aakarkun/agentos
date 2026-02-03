'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import { factoryAbi, getFactoryAddress } from '@/lib/factory';
import { loadStoredWallets, saveStoredWallets } from '@/lib/wallet-storage';
import { decodeEventLog } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getStoredRole } from '@/lib/role';
import { RoleBanner } from '@/components/RoleBanner';
import type { Address } from 'viem';

const STORAGE_KEY = 'openwallet-custom-addresses';
const DEFAULT_USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address;

export default function CreateWalletPage() {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const factoryAddress = getFactoryAddress();
  const [agent, setAgent] = useState('');
  const [human, setHuman] = useState('');
  const [maxAmount, setMaxAmount] = useState('1');
  const [dailyCap, setDailyCap] = useState('10');
  const [approvalThreshold, setApprovalThreshold] = useState('0.5');
  const [walletName, setWalletName] = useState('Main wallet');
  const [mounted, setMounted] = useState(false);

  const { writeContractAsync, isPending, error: writeError } = useWriteContract();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && connectedAddress) setHuman((h) => (h === '' ? connectedAddress : h));
  }, [mounted, connectedAddress]);

  useEffect(() => {
    if (!mounted) return;
    if (!getStoredRole()) router.replace('/');
  }, [mounted, router]);

  const createWallet = async () => {
    if (!factoryAddress || !publicClient) return;
    const agentAddr = agent.trim() as Address;
    const humanAddr = human.trim() as Address;
    if (!/^0x[a-fA-F0-9]{40}$/.test(agentAddr) || !/^0x[a-fA-F0-9]{40}$/.test(humanAddr)) return;
    const max = parseEther(maxAmount);
    const daily = parseEther(dailyCap);
    const threshold = parseEther(approvalThreshold);
    const allowedTokens: Address[] = [DEFAULT_USDC_BASE_SEPOLIA];

    const hash = await writeContractAsync({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: 'createWallet',
      args: [agentAddr, humanAddr, max, daily, threshold, allowedTokens],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    let newWalletAddress: Address | null = null;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: factoryAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'WalletCreated') {
          newWalletAddress = (decoded.args as { wallet: Address }).wallet;
          break;
        }
      } catch {
        // skip
      }
    }

    if (newWalletAddress) {
      const current = loadStoredWallets(STORAGE_KEY);
      const name = walletName.trim() || 'Main wallet';
      saveStoredWallets(STORAGE_KEY, [...current, { address: newWalletAddress, name }]);
      router.push(`/wallet/${encodeURIComponent(newWalletAddress)}`);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!factoryAddress) {
    return (
      <div className="space-y-4">
        <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle>Factory not configured</CardTitle>
            <CardDescription>
              Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_FACTORY_ADDRESS</code> (or{' '}
              <code className="rounded bg-muted px-1">FACTORY_ADDRESS</code> in{' '}
              <code className="rounded bg-muted px-1">packages/contracts/.env</code>) to the deployed
              AgentWalletFactory address, then restart the dev server.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/wallets">Back to Wallets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RoleBanner />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="rounded-full" asChild>
          <Link href="/wallets">← Wallets</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create wallet</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        You're creating a shared wallet: the <strong className="text-foreground">agent</strong> can spend from it (within the limits below), and the <strong className="text-foreground">human</strong> funds it and approves big spends. Connect your wallet to sign and pay gas; the new wallet will appear in your list.
      </p>

      {!connectedAddress && (
        <Card className="rounded-3xl border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Connect your wallet</CardTitle>
            <CardDescription>
              Connect to sign the creation transaction and pay gas.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="rounded-3xl border-border bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Who and how much</CardTitle>
          <CardDescription>
            Who can spend, who approves, and the spending limits. You can change limits later in the wallet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Name (for this app)</label>
            <Input
              className="rounded-full"
              placeholder="e.g. Main wallet"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">What to call this wallet in the dashboard.</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Who can spend? (Agent address)</label>
            <Input
              className="rounded-full font-mono text-sm"
              placeholder="0x..."
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">The wallet address that will spend from this budget (e.g. your AI agent's address).</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Who funds and approves? (Human address)</label>
            <Input
              className="rounded-full font-mono text-sm"
              placeholder="0x..."
              value={human}
              onChange={(e) => setHuman(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Usually you — the person who puts money in and approves transfers above the threshold. Connect your wallet to auto-fill.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-foreground">Max per transaction (ETH)</label>
              <Input
                type="text"
                className="rounded-full mt-1"
                placeholder="1"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Largest single transfer the agent can make.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Daily cap (ETH)</label>
              <Input
                type="text"
                className="rounded-full mt-1"
                placeholder="10"
                value={dailyCap}
                onChange={(e) => setDailyCap(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Max the agent can spend in one day.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Require approval above (ETH)</label>
              <Input
                type="text"
                className="rounded-full mt-1"
                placeholder="0.5"
                value={approvalThreshold}
                onChange={(e) => setApprovalThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Transfers above this need your approval first.</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The wallet can hold ETH and USDC (Base Sepolia). You can change allowed tokens later in the wallet.
          </p>
          {writeError && (
            <p className="text-sm text-destructive">
              {writeError.message}
            </p>
          )}
          <Button
            className="rounded-full"
            onClick={createWallet}
            disabled={!connectedAddress || isPending}
          >
            {isPending ? 'Creating…' : 'Create wallet'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
