/**
 * Wallet = logical wallet (with optional name).
 * Contract address = the on-chain wallet contract address (0x...).
 * We store { address, name } so we can show the name separately from the contract address.
 */

import type { Address } from 'viem';

export interface StoredWallet {
  address: Address;
  name: string;
}

const DEFAULT_NAME = 'Main wallet';

function isAddress(s: string): s is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(s);
}

/** Load stored wallets. Migrates old format (string[]) to { address, name }[]. */
export function loadStoredWallets(key: string): StoredWallet[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item): StoredWallet | null => {
          if (typeof item === 'string' && isAddress(item)) {
            return { address: item as Address, name: DEFAULT_NAME };
          }
          if (item && typeof item === 'object' && typeof item.address === 'string' && isAddress(item.address)) {
            return {
              address: item.address as Address,
              name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : DEFAULT_NAME,
            };
          }
          return null;
        })
        .filter((w): w is StoredWallet => w !== null);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredWallets(key: string, wallets: StoredWallet[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(wallets));
  } catch {
    // ignore
  }
}
