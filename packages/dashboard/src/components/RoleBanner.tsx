'use client';

import { useState, useEffect } from 'react';
import { getStoredRole, type Role } from '@/lib/role';
import { cn } from '@/lib/utils';

const ROLE_COPY: Record<Role, { short: string; sentence: string }> = {
  agent: {
    short: 'Viewing as Agent',
    sentence: 'These are wallets you can spend from. Limits are set by the human who funds them.',
  },
  human: {
    short: 'Viewing as Human',
    sentence: 'You fund these wallets and set limits. You approve or reject what the agent wants to spend.',
  },
};

/** Compact pill for header: "Viewing as Agent" / "Viewing as Human" */
export function RolePill({ className }: { className?: string }) {
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => setRole(getStoredRole()), []);
  if (!role) return null;
  const { short } = ROLE_COPY[role];
  return (
    <span
      className={cn(
        'rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground',
        className
      )}
    >
      {short}
    </span>
  );
}

/** Prominent "You're here as" banner with one-sentence explanation (for Wallets / Create wallet). */
export function RoleBanner({ className }: { className?: string }) {
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => setRole(getStoredRole()), []);
  if (!role) return null;
  const { short, sentence } = ROLE_COPY[role];
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-muted/30 px-4 py-3',
        className
      )}
    >
      <p className="text-sm font-medium text-foreground">{short}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{sentence}</p>
    </div>
  );
}
