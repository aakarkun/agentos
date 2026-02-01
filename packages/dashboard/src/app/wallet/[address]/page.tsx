'use client';

import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { WalletDetails } from '@/components/WalletDetails';

export default function WalletPage() {
  const params = useParams();
  const address = params.address as string;
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center py-12">
            Please connect your wallet to view wallet details
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <WalletDetails address={address} />
      </div>
    </main>
  );
}
