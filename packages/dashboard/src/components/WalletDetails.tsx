'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWalletClient } from 'wagmi';
import { createSDK } from '@/lib/sdk';
import { IconBack, IconWallet, IconSettings, IconUsers } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { parseEther } from 'viem';
import type { Address } from 'viem';
import { ProposalStatus } from '@open-wallet/sdk';
import { getStoredRole } from '@/lib/role';

interface WalletDetailsProps {
  address: Address;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

function formatEth(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4);
}

const contractReadAbi = [
  { type: 'function' as const, name: 'proposalCounter', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function' as const, name: 'agent', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function' as const, name: 'human', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function' as const, name: 'agentPaused', inputs: [], outputs: [{ type: 'bool' }] },
  { type: 'function' as const, name: 'pendingHuman', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function' as const, name: 'humanRotationDelay', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function' as const, name: 'humanRotationInitiatedAt', inputs: [], outputs: [{ type: 'uint256' }] },
];

export function WalletDetails({ address }: WalletDetailsProps) {
  const { data: walletClient } = useWalletClient();
  const [balance, setBalance] = useState<string>('0');
  const [policy, setPolicy] = useState<{ maxAmount: string; dailyCap: string; approvalThreshold: string } | null>(null);
  const [pendingProposals, setPendingProposals] = useState<Array<{ id: bigint; to: string; amount: string; token: string }>>([]);
  const [proposalCounter, setProposalCounter] = useState<number>(0);
  const [agentAddress, setAgentAddress] = useState<Address | null>(null);
  const [humanAddress, setHumanAddress] = useState<Address | null>(null);
  const [agentPaused, setAgentPaused] = useState<boolean>(false);
  const [pendingHuman, setPendingHumanState] = useState<Address | null>(null);
  const [humanRotationDelay, setHumanRotationDelay] = useState<bigint>(0n);
  const [humanRotationInitiatedAt, setHumanRotationInitiatedAt] = useState<bigint>(0n);
  const [canCompleteHumanRotation, setCanCompleteHumanRotation] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState<bigint | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [emergencyTo, setEmergencyTo] = useState('');
  const [policyMax, setPolicyMax] = useState('');
  const [policyDaily, setPolicyDaily] = useState('');
  const [policyThreshold, setPolicyThreshold] = useState('');
  const [newAgentAddress, setNewAgentAddress] = useState('');
  const [newHumanAddress, setNewHumanAddress] = useState('');

  const isHuman = walletClient?.account?.address && humanAddress && walletClient.account.address.toLowerCase() === humanAddress.toLowerCase();
  const busy = actionBusy !== null;

  const loadWallet = useCallback(async () => {
    const sdk = createSDK(address);
    setLoadError(null);
    try {
      const bal = await sdk.getBalance();
      setBalance(formatEth(bal));
      const pol = await sdk.policy.getPolicy();
      setPolicy({
        maxAmount: formatEth(pol.maxAmount),
        dailyCap: formatEth(pol.dailyCap),
        approvalThreshold: formatEth(pol.approvalThreshold),
      });
      const counter = (await sdk.publicClient.readContract({
        address,
        abi: contractReadAbi,
        functionName: 'proposalCounter',
      })) as bigint;
      setProposalCounter(Number(counter));
      const [agent, human, paused, pendingH, delay, initiatedAt] = await Promise.all([
        sdk.publicClient.readContract({ address, abi: contractReadAbi, functionName: 'agent' }) as Promise<Address>,
        sdk.publicClient.readContract({ address, abi: contractReadAbi, functionName: 'human' }) as Promise<Address>,
        sdk.publicClient.readContract({ address, abi: contractReadAbi, functionName: 'agentPaused' }) as Promise<boolean>,
        sdk.publicClient.readContract({ address, abi: contractReadAbi, functionName: 'pendingHuman' }) as Promise<Address>,
        sdk.publicClient.readContract({ address, abi: contractReadAbi, functionName: 'humanRotationDelay' }) as Promise<bigint>,
        sdk.publicClient.readContract({ address, abi: contractReadAbi, functionName: 'humanRotationInitiatedAt' }) as Promise<bigint>,
      ]);
      setAgentAddress(agent);
      setHumanAddress(human);
      setAgentPaused(paused);
      setPendingHumanState(pendingH && pendingH !== ZERO_ADDRESS ? pendingH : null);
      setHumanRotationDelay(delay);
      setHumanRotationInitiatedAt(initiatedAt);
      if (pendingH && pendingH !== ZERO_ADDRESS && initiatedAt > 0n && delay > 0n) {
        const block = await sdk.publicClient.getBlock({ blockTag: 'latest' });
        setCanCompleteHumanRotation(block.timestamp >= initiatedAt + delay);
      } else {
        setCanCompleteHumanRotation(false);
      }
      const pending: typeof pendingProposals = [];
      for (let i = 1; i <= Number(counter); i++) {
        const p = await sdk.getProposal(BigInt(i));
        if (p.status === ProposalStatus.Pending) {
          pending.push({
            id: p.id,
            to: p.to,
            amount: formatEth(p.amount),
            token: p.token === ZERO_ADDRESS ? 'ETH' : p.token,
          });
        }
      }
      setPendingProposals(pending);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isNotContract =
        msg.includes('returned no data') ||
        msg.includes('getPolicy') ||
        msg.includes('not a contract') ||
        msg.includes('ContractFunctionExecutionError');
      if (!isNotContract) console.error(e);
      setLoadError(
        isNotContract
          ? 'This address is not a wallet contract on the current network, or it is not deployed here. If you deployed on local Anvil, set NEXT_PUBLIC_CHAIN_ID=31337 and NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545 in .env and restart the dev server.'
          : 'Failed to load wallet. Check the address and that NEXT_PUBLIC_CHAIN_ID / NEXT_PUBLIC_RPC_URL match the network where the contract is deployed.'
      );
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    if (policy && !policyMax && !policyDaily && !policyThreshold) {
      setPolicyMax(policy.maxAmount);
      setPolicyDaily(policy.dailyCap);
      setPolicyThreshold(policy.approvalThreshold);
    }
  }, [policy, policyMax, policyDaily, policyThreshold]);

  const approve = async (proposalId: bigint) => {
    if (!walletClient?.account) {
      alert('Connect your wallet (human) to approve.');
      return;
    }
    const sdk = createSDK(address);
    const human = sdk.asHuman(walletClient as any);
    setTxPending(proposalId);
    try {
      await human.approveTransfer(proposalId);
      await loadWallet();
    } catch (e) {
      console.error(e);
      alert('Transaction failed');
    } finally {
      setTxPending(null);
    }
  };

  const reject = async (proposalId: bigint) => {
    if (!walletClient?.account) {
      alert('Connect your wallet (human) to reject.');
      return;
    }
    const sdk = createSDK(address);
    const human = sdk.asHuman(walletClient as any);
    setTxPending(proposalId);
    try {
      await human.rejectTransfer(proposalId);
      await loadWallet();
    } catch (e) {
      console.error(e);
      alert('Transaction failed');
    } finally {
      setTxPending(null);
    }
  };

  const runHumanAction = async (label: string, fn: () => Promise<unknown>) => {
    if (!walletClient?.account) {
      alert('Connect your wallet (human) to perform this action.');
      return;
    }
    setActionBusy(label);
    try {
      await fn();
      await loadWallet();
    } catch (e) {
      console.error(e);
      alert('Transaction failed');
    } finally {
      setActionBusy(null);
    }
  };

  const handlePauseAgent = () => {
    if (!confirm('Pause the agent? They will not be able to propose or execute transfers until unpaused.')) return;
    const sdk = createSDK(address);
    runHumanAction('Pause agent', () => sdk.asHuman(walletClient as any).pauseAgent());
  };

  const handleUnpauseAgent = () => {
    const sdk = createSDK(address);
    runHumanAction('Unpause agent', () => sdk.asHuman(walletClient as any).unpauseAgent());
  };

  const handleEmergencyWithdraw = async (to: Address) => {
    if (!to || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
      alert('Enter a valid recipient address.');
      return;
    }
    if (!confirm('Withdraw all ETH (and optional ERC20s) to this address? This cannot be undone.')) return;
    const sdk = createSDK(address);
    runHumanAction('Emergency withdraw', () => sdk.asHuman(walletClient as any).emergencyWithdraw(to, []));
  };

  const handleSetPolicy = async (maxAmountEth: string, dailyCapEth: string, approvalThresholdEth: string) => {
    const maxAmount = parseEther(maxAmountEth);
    const dailyCap = parseEther(dailyCapEth);
    const approvalThreshold = parseEther(approvalThresholdEth);
    if (maxAmount <= 0n) {
      alert('Max amount must be > 0');
      return;
    }
    const sdk = createSDK(address);
    runHumanAction('Set policy', () =>
      sdk.asHuman(walletClient as any).setPolicy({ maxAmount, dailyCap, approvalThreshold })
    );
  };

  const handleRotateAgentKey = (newAgent: Address) => {
    if (!newAgent || !/^0x[a-fA-F0-9]{40}$/.test(newAgent)) {
      alert('Enter a valid new agent address.');
      return;
    }
    if (!confirm('Replace the current agent with this address? The old agent will no longer have access.')) return;
    const sdk = createSDK(address);
    runHumanAction('Rotate agent key', () => sdk.asHuman(walletClient as any).rotateAgentKey(newAgent));
  };

  const handleInitiateHumanRotation = (newHuman: Address) => {
    if (!newHuman || !/^0x[a-fA-F0-9]{40}$/.test(newHuman)) {
      alert('Enter a valid new human address.');
      return;
    }
    if (!confirm('Initiate human key rotation? The new human can take over after the timelock delay.')) return;
    const sdk = createSDK(address);
    runHumanAction('Initiate human rotation', () => sdk.asHuman(walletClient as any).initiateHumanKeyRotation(newHuman));
  };

  const handleCompleteHumanRotation = () => {
    if (!confirm('Complete human key rotation? You will no longer be the human for this wallet.')) return;
    const sdk = createSDK(address);
    runHumanAction('Complete human rotation', () => sdk.asHuman(walletClient as any).completeHumanKeyRotation());
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading wallet...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="gap-2">
            <IconBack />
            Back
          </Link>
        </Button>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Cannot load wallet</CardTitle>
            <CardDescription className="text-destructive/90">{loadError}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The address <code className="font-mono text-xs break-all rounded bg-muted px-1">{address}</code> may be an EOA, a different contract, or deployed on another network. Ensure <code className="font-mono text-xs">NEXT_PUBLIC_CHAIN_ID</code> and <code className="font-mono text-xs">NEXT_PUBLIC_RPC_URL</code> point to the chain where your wallet is deployed (e.g. 31337 and http://127.0.0.1:8545 for local Anvil).
            </p>
            <p className="text-xs">
              Dashboard is using: chainId {process.env.NEXT_PUBLIC_CHAIN_ID ?? '31337'}, RPC {process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const role = typeof window !== 'undefined' ? getStoredRole() : null;
  const youAreLine =
    role === 'human' && isHuman
      ? "You're the human for this wallet. You can approve transfers, set limits, and use emergency actions."
      : role === 'human' && !isHuman
        ? "You're viewing as Human. Connect with the human address to approve or change limits."
        : role === 'agent'
          ? null
          : "Viewing wallet. Connect as the human to approve or change limits.";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/wallets" className="gap-2">
          <IconBack />
          Back to Wallets
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <IconWallet className="text-primary" />
          Wallet
        </h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground break-all">{address}</p>
        <div className="mt-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
          {youAreLine !== null ? (
            <p className="text-sm text-muted-foreground">{youAreLine}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You're the agent for this wallet. Here you see balance and limits. To send money, use the AgentOS SDK in your code (e.g. your AI agent or app); see the <Link href="/skills" className="font-medium text-foreground underline underline-offset-2 hover:no-underline">Skills tab</Link> for how.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance</CardTitle>
            <CardDescription>ETH in this wallet. Send ETH to this address to fund it.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{balance} ETH</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending limits</CardTitle>
            <CardDescription>Max per transaction, daily cap, and amount above which the human must approve.</CardDescription>
          </CardHeader>
          <CardContent>
            {policy ? (
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Max per tx: {policy.maxAmount} ETH</li>
                <li>Daily cap: {policy.dailyCap} ETH</li>
                <li>Approval above: {policy.approvalThreshold} ETH</li>
              </ul>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Proposals</CardTitle>
          <CardDescription>
            {pendingProposals.length === 0 ? 'No pending proposals' : `${pendingProposals.length} pending`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingProposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending proposals</p>
          ) : (
            <div className="space-y-4">
              {pendingProposals.map((proposal) => (
                <div
                  key={String(proposal.id)}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">Proposal #{String(proposal.id)}</p>
                    <p className="text-sm text-muted-foreground">
                      {proposal.amount} {proposal.token} to {proposal.to.slice(0, 10)}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approve(proposal.id)}
                      disabled={txPending !== null || !isHuman}
                    >
                      {txPending === proposal.id ? '...' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => reject(proposal.id)}
                      disabled={txPending !== null || !isHuman}
                    >
                      {txPending === proposal.id ? '...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {agentAddress != null && humanAddress != null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconUsers className="text-primary" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Agent: <code className="font-mono text-xs break-all">{agentAddress}</code></p>
            <p>Human: <code className="font-mono text-xs break-all">{humanAddress}</code></p>
            {agentPaused && (
              <p className="mt-2 font-medium text-amber-500">Agent is paused</p>
            )}
          </CardContent>
        </Card>
      )}

      {isHuman && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconSettings className="text-primary" />
              Human actions
            </CardTitle>
            <CardDescription>Connect your wallet as the human to use these. All actions require a transaction.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 rounded-lg border border-border p-4">
              <h3 className="font-medium text-foreground">Pause / Unpause agent</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handlePauseAgent}
                  disabled={busy || agentPaused}
                >
                  {actionBusy === 'Pause agent' ? '...' : 'Pause agent'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleUnpauseAgent}
                  disabled={busy || !agentPaused}
                >
                  {actionBusy === 'Unpause agent' ? '...' : 'Unpause agent'}
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-4">
              <h3 className="font-medium text-foreground">Emergency withdraw</h3>
              <p className="text-sm text-muted-foreground">Send all ETH (and optional ERC20s) to a recipient. Use with caution.</p>
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Recipient 0x..."
                  value={emergencyTo}
                  onChange={(e) => setEmergencyTo(e.target.value)}
                  className="min-w-[200px] flex-1 font-mono text-sm"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleEmergencyWithdraw(emergencyTo as Address)}
                  disabled={busy || !emergencyTo.trim()}
                >
                  {actionBusy === 'Emergency withdraw' ? '...' : 'Withdraw all'}
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-4">
              <h3 className="font-medium text-foreground">Update spending limits</h3>
              <p className="text-sm text-muted-foreground">Set how much the agent can use or spend (max per tx, daily cap, approval threshold) in ETH.</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder="Max per tx (ETH)"
                  value={policyMax}
                  onChange={(e) => setPolicyMax(e.target.value)}
                />
                <Input
                  placeholder="Daily cap (ETH)"
                  value={policyDaily}
                  onChange={(e) => setPolicyDaily(e.target.value)}
                />
                <Input
                  placeholder="Approval above (ETH)"
                  value={policyThreshold}
                  onChange={(e) => setPolicyThreshold(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                onClick={() => handleSetPolicy(policyMax, policyDaily, policyThreshold)}
                disabled={busy || !policyMax || !policyDaily || !policyThreshold}
              >
                {actionBusy === 'Set policy' ? '...' : 'Update limits'}
              </Button>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-4">
              <h3 className="font-medium text-foreground">Rotate agent key</h3>
              <p className="text-sm text-muted-foreground">Replace the current agent address. The old agent will lose access.</p>
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="New agent address 0x..."
                  value={newAgentAddress}
                  onChange={(e) => setNewAgentAddress(e.target.value)}
                  className="min-w-[200px] flex-1 font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleRotateAgentKey(newAgentAddress as Address)}
                  disabled={busy || !newAgentAddress.trim()}
                >
                  {actionBusy === 'Rotate agent key' ? '...' : 'Rotate agent'}
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-4">
              <h3 className="font-medium text-foreground">Human key rotation</h3>
              {pendingHuman ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Pending human: <code className="font-mono text-xs break-all">{pendingHuman}</code>
                    {canCompleteHumanRotation ? ' — Timelock expired. You can complete.' : ' — Wait for timelock before completing.'}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleCompleteHumanRotation}
                    disabled={busy || !canCompleteHumanRotation}
                  >
                    {actionBusy === 'Complete human rotation' ? '...' : 'Complete rotation'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Initiate a timelocked handover to a new human address.</p>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="New human address 0x..."
                      value={newHumanAddress}
                      onChange={(e) => setNewHumanAddress(e.target.value)}
                      className="min-w-[200px] flex-1 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleInitiateHumanRotation(newHumanAddress as Address)}
                      disabled={busy || !newHumanAddress.trim()}
                    >
                      {actionBusy === 'Initiate human rotation' ? '...' : 'Initiate rotation'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
