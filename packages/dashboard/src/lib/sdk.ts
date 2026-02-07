'use client';

import { AgentOSSDK } from '@agentos/sdk';
import type { Address } from 'viem';

const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID, 10) : 31337;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';

export function createSDK(walletAddress: Address): AgentOSSDK {
  return new AgentOSSDK({
    walletAddress,
    rpcUrl,
    chainId,
  });
}

export function getDefaultWalletAddresses(): Address[] {
  const env = process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESSES;
  if (!env) return [];
  return env.split(',').map((a) => a.trim() as Address).filter(Boolean);
}
