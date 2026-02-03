/**
 * Factory contract for creating new AgentWallet instances from the app.
 */

export const factoryAbi = [
  {
    type: 'function' as const,
    name: 'createWallet',
    inputs: [
      { name: 'agent', type: 'address', internalType: 'address' },
      { name: 'human', type: 'address', internalType: 'address' },
      { name: 'maxAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'dailyCap', type: 'uint256', internalType: 'uint256' },
      { name: 'approvalThreshold', type: 'uint256', internalType: 'uint256' },
      { name: 'allowedTokens', type: 'address[]', internalType: 'address[]' },
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable' as const,
  },
  {
    type: 'event' as const,
    name: 'WalletCreated',
    inputs: [
      { name: 'wallet', type: 'address', indexed: true, internalType: 'address' },
      { name: 'agent', type: 'address', indexed: true, internalType: 'address' },
      { name: 'human', type: 'address', indexed: true, internalType: 'address' },
    ],
  },
] as const;

export function getFactoryAddress(): `0x${string}` | null {
  const raw = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '').trim();
  if (!raw || !/^0x[a-fA-F0-9]{40}$/.test(raw)) return null;
  return raw as `0x${string}`;
}
