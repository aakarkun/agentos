'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { IconWallet } from '@/lib/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RolePill } from '@/components/RoleBanner';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/wallets', label: 'Wallets' },
  { href: '/skills', label: 'Skills' },
  { href: '/setup', label: 'Setup' },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWalletDetail = pathname.startsWith('/wallet/');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar - Reown/Coinbase/Metamask style: dark, minimal, single row */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-14 items-center px-4 lg:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-foreground hover:text-primary transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconWallet className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline-block">OpenWallet</span>
          </Link>

          {/* Horizontal nav tabs */}
          <nav className="ml-8 flex items-center gap-0.5 rounded-full bg-muted/50 p-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
            {isWalletDetail && (
              <span className="rounded-full px-3 py-2 text-sm font-medium bg-background text-foreground shadow-sm">
                Wallet details
              </span>
            )}
          </nav>

          {pathname !== '/' && <RolePill className="ml-4" />}

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <ConnectButton
              showBalance={false}
              accountStatus="address"
              chainStatus="icon"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
