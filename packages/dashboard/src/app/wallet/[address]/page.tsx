'use client';

import { useParams } from 'next/navigation';
import { WalletDetails } from '@/components/WalletDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WalletPage() {
  const params = useParams();
  const address = decodeURIComponent((params.address as string) || '') as `0x${string}`;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Invalid wallet address</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">The provided address is not a valid Ethereum address.</p>
        </CardContent>
      </Card>
    );
  }

  return <WalletDetails address={address} />;
}
