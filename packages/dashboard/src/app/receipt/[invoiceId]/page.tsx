'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

const chainExplorer: Record<number, string> = {
  31337: '',
  84532: 'https://sepolia.basescan.org',
  8453: 'https://basescan.org',
};

export default function ReceiptPage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;
    fetch(`/api/invoices/${invoiceId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then(setInvoice)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading || (!invoice && !error)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <Card className="rounded-3xl border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Not found</CardTitle>
            <CardDescription>{error ?? 'Invoice not found.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/">Back to AgentOS</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const explorerUrl = chainExplorer[invoice.chain_id];
  const txUrl = explorerUrl && invoice.tx_hash ? `${explorerUrl}/tx/${invoice.tx_hash}` : null;
  const isEth = !invoice.token_address || invoice.token_address === '';

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Card className="rounded-3xl border-border">
        <CardHeader>
          <CardTitle>Receipt</CardTitle>
          <CardDescription>
            Invoice {invoice.status === 'paid' ? 'paid' : invoice.status === 'void' ? 'void' : 'issued'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium text-foreground capitalize">{invoice.status}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1">
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-mono text-foreground">{invoice.amount} {isEth ? 'wei (ETH)' : 'units'}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1">
            <p className="text-sm text-muted-foreground">To</p>
            <p className="font-mono text-sm text-foreground break-all">{invoice.to_wallet_address}</p>
          </div>
          {invoice.tx_hash && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1">
              <p className="text-sm text-muted-foreground">Transaction</p>
              <p className="font-mono text-sm text-foreground break-all">{invoice.tx_hash}</p>
              {txUrl && (
                <a href={txUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  View on explorer →
                </a>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Created {new Date(invoice.created_at).toLocaleString()}
          </p>
          <Button variant="outline" className="rounded-full w-full" asChild>
            <Link href="/">Back to AgentOS</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
