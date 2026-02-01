'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

export function WalletList() {
  const { address } = useAccount();
  const [wallets] = useState<string[]>([]); // TODO: Fetch from indexer or registry

  if (wallets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Agent Wallets</h2>
        <p className="text-gray-600 dark:text-gray-400">
          No wallets found. Deploy a wallet using the deployment script.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Your Agent Wallets</h2>
      {wallets.map((wallet) => (
        <div
          key={wallet}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold mb-2">Wallet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {wallet}
              </p>
            </div>
            <a
              href={`/wallet/${wallet}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Details
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
