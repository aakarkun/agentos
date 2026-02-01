'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { WalletList } from '@/components/WalletList';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">OpenWallet</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Wallet infrastructure for AI agents. Agents earn, humans oversee.
            </p>
          </div>
          <ConnectButton />
        </div>

        {isConnected ? (
          <WalletList />
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Connect your wallet to view your agent wallets
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
