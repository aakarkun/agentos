'use client';

import { useState, useEffect } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';

interface WalletDetailsProps {
  address: Address;
}

export function WalletDetails({ address }: WalletDetailsProps) {
  const { address: userAddress } = useAccount();
  const [balance, setBalance] = useState<string>('0');
  const [pendingProposals, setPendingProposals] = useState<any[]>([]);

  // TODO: Fetch wallet data from indexer/contract
  useEffect(() => {
    // Placeholder - would fetch from indexer
  }, [address]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wallet Details</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Balance</h2>
          <p className="text-2xl font-bold">{balance} ETH</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Policy</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Policy details will be displayed here
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Proposals</h2>
        {pendingProposals.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No pending proposals
          </p>
        ) : (
          <div className="space-y-4">
            {pendingProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="border rounded p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">Proposal #{proposal.id}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {proposal.amount} ETH to {proposal.to}
                  </p>
                </div>
                <div className="space-x-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
