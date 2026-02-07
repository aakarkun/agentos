'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const erc20TransferAbi = [
  {
    type: 'function' as const,
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable' as const,
  },
] as const;

type Invoice = {
  id: string;
  agent_id: string;
  to_wallet_address: string;
  amount: string;
  token_address: string | null;
  chain_id: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
};

export default function PayInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paidTxHash, setPaidTxHash] = useState<string | null>(null);

  const { address: connectedAddress, isConnected } = useAccount();

  const isEth = !invoice?.token_address || invoice.token_address === '';
  const amountBigInt = invoice?.amount ? BigInt(invoice.amount) : 0n;

  const { sendTransactionAsync: sendEth, isPending: ethPending } = useSendTransaction();
  const { writeContractAsync: sendErc20, isPending: erc20Pending } = useWriteContract();
  const isPending = ethPending || erc20Pending;

  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const { data: receipt } = useWaitForTransactionReceipt({ hash: txHash ?? undefined });

  useEffect(() => {
    if (!invoiceId) return;
    fetch(`/api/invoices/${invoiceId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Invoice not found'))))
      .then(setInvoice)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  // After tx confirmed, mark invoice paid and redirect
  useEffect(() => {
    if (!receipt?.transactionHash || !invoiceId) return;
    const hash = receipt.transactionHash;
    setPaidTxHash(hash);
    fetch(`/api/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', tx_hash: hash }),
    })
      .then((r) => { if (!r.ok) throw new Error('Failed to update invoice'); })
      .then(() => router.push(`/receipt/${invoiceId}`))
      .catch(() => setError('Payment sent but failed to update invoice. See receipt.'));
  }, [receipt?.transactionHash, invoiceId, router]);

  const pay = async () => {
    if (!invoice || !connectedAddress) return;
    setError(null);
    try {
      if (isEth) {
        const hash = await sendEth({
          to: invoice.to_wallet_address as `0x${string}`,
          value: amountBigInt,
        });
        if (hash) setTxHash(hash);
      } else {
        const hash = await sendErc20({
          address: invoice.token_address as `0x${string}`,
          abi: erc20TransferAbi,
          functionName: 'transfer',
          args: [invoice.to_wallet_address as `0x${string}`, amountBigInt],
        });
        if (hash) setTxHash(hash);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    }
  };

  if (loading || !invoice) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">{loading ? 'Loading…' : error ?? 'Not found'}</p>
      </div>
    );
  }

  if (invoice.status !== 'issued') {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <Card className="rounded-3xl border-border">
          <CardHeader>
            <CardTitle>Invoice {invoice.status === 'paid' ? 'paid' : 'void'}</CardTitle>
            <CardDescription>
              This invoice has already been {invoice.status}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="rounded-full" asChild>
              <Link href={`/receipt/${invoiceId}`}>View receipt</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Card className="rounded-3xl border-border">
        <CardHeader>
          <CardTitle>Pay invoice</CardTitle>
          <CardDescription>
            Send {isEth ? 'ETH' : 'token'} to the governed wallet below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1">
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-mono text-lg font-medium text-foreground">{invoice.amount} {isEth ? 'wei (ETH)' : 'units'}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1">
            <p className="text-sm text-muted-foreground">To</p>
            <p className="font-mono text-sm text-foreground break-all">{invoice.to_wallet_address}</p>
          </div>
          {!isConnected && (
            <p className="text-sm text-amber-600">Connect your wallet to pay.</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            className="rounded-full w-full"
            onClick={pay}
            disabled={!isConnected || isPending}
          >
            {isPending ? 'Confirm in wallet…' : paidTxHash ? 'Redirecting…' : `Pay ${isEth ? 'ETH' : 'token'}`}
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full w-full" asChild>
            <Link href="/">Back to AgentOS</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
