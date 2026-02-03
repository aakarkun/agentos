'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getDefaultWalletAddresses } from '@/lib/sdk';
import { IconAdd, IconRemove, IconWallet } from '@/lib/icons';
import { loadStoredWallets, saveStoredWallets, type StoredWallet } from '@/lib/wallet-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Address } from 'viem';

const DEFAULT_NAME = 'Main wallet';

export function WalletList({ storageKey }: { storageKey?: string }) {
  const envWallets = useMemo(() => getDefaultWalletAddresses(), []);
  const [customWallets, setCustomWallets] = useState<StoredWallet[]>([]);
  const [customAddress, setCustomAddress] = useState('');
  const [customName, setCustomName] = useState('');
  const [editingNameFor, setEditingNameFor] = useState<Address | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  useEffect(() => {
    if (storageKey) setCustomWallets(loadStoredWallets(storageKey));
  }, [storageKey]);

  /** Combined list: env wallets (read-only name) + custom wallets (editable name). */
  const displayList = useMemo(() => {
    const envItems: { address: Address; name: string; isCustom: false }[] = envWallets.map((addr) => ({
      address: addr,
      name: DEFAULT_NAME,
      isCustom: false as const,
    }));
    const customItems: { address: Address; name: string; isCustom: true }[] = customWallets.map((w) => ({
      address: w.address,
      name: w.name,
      isCustom: true as const,
    }));
    return [...envItems, ...customItems];
  }, [envWallets, customWallets]);

  const addWallet = () => {
    const trimmed = customAddress.trim();
    if (!trimmed || !/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return;
    const name = customName.trim() || DEFAULT_NAME;
    const already = customWallets.some((w) => w.address.toLowerCase() === trimmed.toLowerCase());
    if (already) return;
    const next = [...customWallets, { address: trimmed as Address, name }];
    setCustomWallets(next);
    if (storageKey) saveStoredWallets(storageKey, next);
    setCustomAddress('');
    setCustomName('');
  };

  const removeWallet = (addr: Address) => {
    const next = customWallets.filter((w) => w.address.toLowerCase() !== addr.toLowerCase());
    setCustomWallets(next);
    if (storageKey) saveStoredWallets(storageKey, next);
  };

  const updateName = (addr: Address, newName: string) => {
    const name = newName.trim() || DEFAULT_NAME;
    const next = customWallets.map((w) =>
      w.address.toLowerCase() === addr.toLowerCase() ? { ...w, name } : w
    );
    setCustomWallets(next);
    if (storageKey) saveStoredWallets(storageKey, next);
    setEditingNameFor(null);
    setEditNameValue('');
  };

  const startEditName = (addr: Address, currentName: string) => {
    setEditingNameFor(addr);
    setEditNameValue(currentName);
  };

  const addForm = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end flex-1">
      <Input
        type="text"
        placeholder="Contract address 0x..."
        value={customAddress}
        onChange={(e) => setCustomAddress(e.target.value)}
        className="font-mono text-sm"
      />
      <Input
        type="text"
        placeholder="Name (optional)"
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        className="sm:w-40"
      />
    </div>
  );

  if (displayList.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="rounded-3xl border-border bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <IconWallet className="text-primary" />
              Main Wallets
            </CardTitle>
            <CardDescription>
              Each wallet is a shared budget: the human funds it, the agent spends from it (within limits). Add a contract address below or create a new wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              {addForm}
              <Button type="button" onClick={addWallet} className="shrink-0 rounded-full">
                <IconAdd />
                Add wallet
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Or{' '}
              <Link href="/wallets/create" className="font-medium text-foreground underline underline-offset-2 hover:no-underline">
                create a new wallet
              </Link>{' '}
              from the app (human signs and pays gas).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {displayList.map((item) => {
          const isEditing = editingNameFor !== null && editingNameFor.toLowerCase() === item.address.toLowerCase();
          const shortAddr = `${item.address.slice(0, 6)}…${item.address.slice(-4)}`;
          return (
            <Card key={item.address} className="rounded-3xl transition-colors hover:border-primary/30">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Input
                        className="h-8 w-40 font-semibold rounded-full"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onBlur={() => updateName(item.address, editNameValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updateName(item.address, editNameValue);
                          if (e.key === 'Escape') {
                            setEditingNameFor(null);
                            setEditNameValue('');
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <h3 className="font-semibold text-foreground truncate">
                        {item.name}
                        {item.isCustom && (
                          <button
                            type="button"
                            onClick={() => startEditName(item.address, item.name)}
                            className="ml-2 text-xs font-normal text-muted-foreground hover:text-foreground"
                          >
                            Edit
                          </button>
                        )}
                      </h3>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{shortAddr}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="rounded-full flex-1">
                    <Link href={`/wallet/${encodeURIComponent(item.address)}`}>
                      View
                    </Link>
                  </Button>
                  {item.isCustom && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-muted-foreground hover:text-destructive"
                      onClick={() => removeWallet(item.address)}
                    >
                      <IconRemove />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-3xl border-dashed border-border bg-muted/20">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          {addForm}
          <Button type="button" onClick={addWallet} variant="outline" size="sm" className="shrink-0 rounded-full">
            <IconAdd />
            Add another wallet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
