'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { http } from 'viem';
import { defineChain } from 'viem';
import { useState, useEffect } from 'react';

/** Local Anvil (Foundry) — chain ID 31337. Use when NEXT_PUBLIC_CHAIN_ID=31337 and NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545. */
const localhost = defineChain({
  id: 31337,
  name: 'Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
});

const projectId = (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '').trim();
const hasValidProjectId =
  projectId.length >= 10 &&
  projectId !== 'demo' &&
  projectId !== 'your_project_id' &&
  !projectId.startsWith('your_');

/** Singleton wagmi config so WalletConnect Core is only initialized once. */
function getWagmiConfig() {
  const key = '__openwallet_wagmi_config';
  if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>)[key]) {
    return (globalThis as Record<string, unknown>)[key] as ReturnType<typeof getDefaultConfig>;
  }
  const isLocal =
    process.env.NEXT_PUBLIC_CHAIN_ID === '31337' ||
    (process.env.NEXT_PUBLIC_RPC_URL ?? '').includes('127.0.0.1');
  const chains = isLocal ? [localhost, baseSepolia, base] : [baseSepolia, base];
  const config = getDefaultConfig({
    appName: 'OpenWallet',
    projectId: hasValidProjectId ? projectId : '00000000000000000000000000000000',
    chains,
    transports: {
      [localhost.id]: http('http://127.0.0.1:8545'),
      [baseSepolia.id]: http(),
      [base.id]: http(),
    },
  });
  if (typeof globalThis !== 'undefined') (globalThis as Record<string, unknown>)[key] = config;
  return config;
}

/** Singleton QueryClient so we don't create new instances on remount. */
function getQueryClient() {
  const key = '__openwallet_query_client';
  if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>)[key]) {
    return (globalThis as Record<string, unknown>)[key] as QueryClient;
  }
  const client = new QueryClient();
  if (typeof globalThis !== 'undefined') (globalThis as Record<string, unknown>)[key] = client;
  return client;
}

/** Renders children only after client mount to avoid WalletConnect subscribing during SSR/hydration. */
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--foreground)', opacity: 0.7 }}>Loading…</span>
      </div>
    );
  }
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const config = getWagmiConfig();
  const queryClient = getQueryClient();
  return (
    <ClientOnly>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="openwallet-theme">
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <WalletConnectIdBanner />
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </ClientOnly>
  );
}

const WALLETCONNECT_BANNER_DISMISSED_KEY = 'openwallet-wc-banner-dismissed';
const ALLOWLIST_TIP_DISMISSED_KEY = 'openwallet-allowlist-tip-dismissed';

/** Shown when WalletConnect project ID is missing, or allowlist tip when ID is set. Dismissible. */
function WalletConnectIdBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return hasValidProjectId
      ? sessionStorage.getItem(ALLOWLIST_TIP_DISMISSED_KEY) === '1'
      : sessionStorage.getItem(WALLETCONNECT_BANNER_DISMISSED_KEY) === '1';
  });
  const isEmpty = projectId.length === 0;

  const handleDismiss = () => {
    sessionStorage.setItem(
      hasValidProjectId ? ALLOWLIST_TIP_DISMISSED_KEY : WALLETCONNECT_BANNER_DISMISSED_KEY,
      '1'
    );
    setDismissed(true);
  };

  if (dismissed) return null;

  if (hasValidProjectId) {
    return (
      <div
        role="status"
        style={{
          background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)',
          color: '#1e40af',
          padding: '10px 16px',
          fontSize: '14px',
          textAlign: 'center',
          borderBottom: '1px solid #3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>
          If you see an <strong>allowlist</strong> warning: add exactly <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4 }}>http://localhost:3000</code> in{' '}
          <a href="https://cloud.reown.com" target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', textDecoration: 'underline', fontWeight: 600 }}>Reown Cloud</a>
          {' '}→ your project → <strong>Domain</strong> → Allowed origins. Wait 1–2 min, then <strong>hard refresh</strong> (Ctrl+Shift+R or Cmd+Shift+R).
        </span>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: '1px solid #3b82f6',
            color: '#1e40af',
            padding: '4px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      style={{
        background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
        color: '#92400e',
        padding: '10px 16px',
        fontSize: '14px',
        textAlign: 'center',
        borderBottom: '1px solid #f59e0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span>
        Set{' '}
        <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4 }}>
          NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
        </code>
        {' '}in <strong>packages/contracts/.env</strong> (the dashboard reads that file; copy from packages/contracts/.env.example).
        {isEmpty && (
          <span style={{ display: 'block', marginTop: 6 }}>
            <strong>If you already added it, restart the dev server</strong> (Next.js only reads env at startup).
          </span>
        )}
        {' '}
        <a
          href="https://cloud.walletconnect.com/sign-in"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#b45309', textDecoration: 'underline', fontWeight: 600 }}
        >
          Get a free Project ID →
        </a>
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: '1px solid #f59e0b',
          color: '#92400e',
          padding: '4px 10px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
