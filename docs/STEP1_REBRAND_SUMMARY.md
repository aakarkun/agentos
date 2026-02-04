# STEP 1 — Rebrand Summary (OpenWallet → AgentOS)

**No functional change.** UI/copy only; localStorage keys and package names left as-is to minimize churn.

## Files changed

| File | Change |
|------|--------|
| `packages/dashboard/src/components/AppShell.tsx` | Nav label "OpenWallet" → "AgentOS"; added nav items Agents, Pay. |
| `packages/dashboard/src/components/Landing.tsx` | Hero title and copy "OpenWallet" → "AgentOS" (2 places). |
| `packages/dashboard/src/app/layout.tsx` | Metadata title "AgentOS - Dashboard", description updated. |
| `packages/dashboard/src/app/providers.tsx` | RainbowKit appName "OpenWallet" → "AgentOS". |
| `packages/dashboard/src/components/WalletDetails.tsx` | Copy "OpenWallet SDK" → "AgentOS SDK". |
| `packages/dashboard/src/app/skills/page.tsx` | Copy "OpenWallet" → "AgentOS" (2 places). |
| `packages/dashboard/src/app/api/skills/install/route.ts` | Comments and script echo text → "AgentOS" (4 places). |

## Not changed (by design)

- **Package names:** `@open-wallet/sdk`, `@open-wallet/dashboard`, etc. (avoids import churn.)
- **localStorage keys:** `openwallet-role`, `openwallet-custom-addresses`, `openwallet-theme`, etc. (avoids migration.)
- **SDK class name:** `OpenWalletSDK` in `@open-wallet/sdk` (no code changes in SDK.)
- **Skills config key:** `openwallet` in JSON and install path `openwallet.json` (API compatibility.)

## Diff summary

- **7 files** touched for rebrand.
- **Nav:** Overview, **Agents**, Wallets, **Pay**, Skills, Setup.
- **Copy:** All user-facing "OpenWallet" → "AgentOS"; install script and skills page text updated.
