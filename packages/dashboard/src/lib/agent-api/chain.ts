/**
 * Server-side chain + RPC for Agent API (transfers/propose). Uses NEXT_PUBLIC_* from env.
 */

import { createPublicClient, createWalletClient, http, type Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const localhost = defineChain({
  id: 31337,
  name: 'Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
});

export function getChain(): Chain {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '31337', 10);
  const rpc = (process.env.NEXT_PUBLIC_RPC_URL ?? '').trim();
  if (chainId === 31337 || rpc.includes('127.0.0.1')) return localhost;
  if (chainId === baseSepolia.id) return baseSepolia;
  if (chainId === base.id) return base;
  return localhost;
}

export function getRpcUrl(): string {
  return (process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545').trim();
}

export function createServerPublicClient() {
  const chain = getChain();
  const rpcUrl = getRpcUrl();
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

export function createServerWalletClient(privateKey: `0x${string}`) {
  const chain = getChain();
  const rpcUrl = getRpcUrl();
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });
}
