# AgentOS Weekend 1 — Deliverables

## 1) Checklist of changes

### STEP 0 — Repo scan
- **docs/STEP0_REPO_SCAN.md** — Repo tree, dashboard routes, env system, token transfer utilities.

### STEP 1 — Rebrand (no functional change)
- **packages/dashboard/src/components/AppShell.tsx** — Nav label "OpenWallet" → "AgentOS"; added nav items Agents, Pay.
- **packages/dashboard/src/components/Landing.tsx** — Hero title and copy "OpenWallet" → "AgentOS".
- **packages/dashboard/src/app/layout.tsx** — Metadata title/description → AgentOS.
- **packages/dashboard/src/app/providers.tsx** — RainbowKit appName → AgentOS.
- **packages/dashboard/src/components/WalletDetails.tsx** — Copy "OpenWallet SDK" → "AgentOS SDK".
- **packages/dashboard/src/app/skills/page.tsx** — Copy "OpenWallet" → "AgentOS".
- **packages/dashboard/src/app/api/skills/install/route.ts** — Comments and script echo text → AgentOS.
- **packages/dashboard/next.config.js** — Load SUPABASE_URL, SUPABASE_ANON_KEY from contracts .env.

### STEP 2 — Agent Registry Lite
- **supabase/migrations/001_agents_audit.sql** — Tables: agents, agent_wallets, audit_logs.
- **packages/dashboard/src/lib/supabase.ts** — Supabase server client + types.
- **packages/dashboard/package.json** — Added @supabase/supabase-js.
- **packages/dashboard/src/app/api/agents/route.ts** — GET list, POST create (audit AGENT_CREATED).
- **packages/dashboard/src/app/api/agents/[id]/route.ts** — GET one agent.
- **packages/dashboard/src/app/api/agents/[id]/wallets/route.ts** — GET list, POST link wallet (audit WALLET_LINKED).
- **packages/dashboard/src/app/api/agents/[id]/audit/route.ts** — GET recent audit logs.
- **packages/dashboard/src/app/api/audit/route.ts** — POST append audit (WALLET_DEPLOYED, POLICY_UPDATED).
- **packages/dashboard/src/app/agents/page.tsx** — List agents + "Create agent".
- **packages/dashboard/src/app/agents/new/page.tsx** — Form: name, owner_address.
- **packages/dashboard/src/app/agents/[id]/page.tsx** — Agent details, linked wallets, "Link existing wallet", "Deploy new wallet", recent audit logs.

### STEP 3 — AgentPay Lite
- **supabase/migrations/002_invoices.sql** — Table: invoices.
- **packages/dashboard/src/app/api/invoices/route.ts** — GET list (optional agent_id), POST create (audit INVOICE_CREATED).
- **packages/dashboard/src/app/api/invoices/[id]/route.ts** — GET one, PATCH status/tx_hash (audit PAYMENT_SENT, INVOICE_PAID).
- **packages/dashboard/src/app/pay/page.tsx** — Create invoice: pick agent + linked wallet, amount, token (ETH default), chain_id.
- **packages/dashboard/src/app/pay/[invoiceId]/page.tsx** — Public pay page: ETH or ERC20 transfer to to_wallet_address; on success PATCH paid + tx_hash, redirect to receipt.
- **packages/dashboard/src/app/receipt/[invoiceId]/page.tsx** — Receipt: status, tx_hash, explorer link.

### STEP 4 — Keep wallet pages
- **packages/dashboard/src/app/wallets/page.tsx** — Unchanged.
- **packages/dashboard/src/app/wallets/create/page.tsx** — Added returnTo support: after create redirect to returnTo?newWallet=address (e.g. from agents/[id] "Deploy new wallet").
- **packages/dashboard/src/app/wallet/[address]/page.tsx** — Unchanged.
- Agent details page links to /wallet/[address] via "View wallet".

### Prisma fallback
- **prisma/schema.prisma** — Optional SQLite schema matching agents, agent_wallets, audit_logs, invoices (dashboard currently uses Supabase only).

---

## 2) SQL migration files (Supabase)

- **supabase/migrations/001_agents_audit.sql** — agents, agent_wallets, audit_logs.
- **supabase/migrations/002_invoices.sql** — invoices.

Run in Supabase SQL Editor (Dashboard → SQL Editor) or via Supabase CLI: `supabase db push`.

---

## 3) New routes and components

| Route | Purpose |
|-------|--------|
| `/agents` | List agents, link to create. |
| `/agents/new` | Form: name, owner_address → POST /api/agents. |
| `/agents/[id]` | Agent details, linked wallets, link wallet form, deploy new wallet link, audit logs. |
| `/pay` | Create invoice: agent, linked wallet, amount, token, chain_id. |
| `/pay/[invoiceId]` | Public pay page: connect wallet, pay ETH or ERC20 to governed wallet. |
| `/receipt/[invoiceId]` | Receipt: status, tx_hash, explorer link. |

**API routes:** `/api/agents`, `/api/agents/[id]`, `/api/agents/[id]/wallets`, `/api/agents/[id]/audit`, `/api/audit`, `/api/invoices`, `/api/invoices/[id]`.

**New lib:** `packages/dashboard/src/lib/supabase.ts` (getSupabase, types).

---

## 4) Env vars added

- **SUPABASE_URL** — Supabase project URL (e.g. https://xxx.supabase.co).
- **SUPABASE_ANON_KEY** — Supabase anon/public key.

Set in `packages/contracts/.env` or `packages/dashboard/.env` (next.config loads from contracts/.env). Documented in `.env.example` and `packages/dashboard/.env.example`.

---

## 5) How to run locally

1. **Install**
   ```bash
   cd /Users/kusgautam/open-wallet
   pnpm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run SQL: paste `supabase/migrations/001_agents_audit.sql` and `002_invoices.sql` in SQL Editor and run.
   - Copy Project URL and anon key into `packages/contracts/.env`:
     ```
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Contracts / chain**
   - For local Anvil: `cd packages/contracts && anvil`, then deploy factory and set in .env:
     - `NEXT_PUBLIC_CHAIN_ID=31337`, `NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545`, `NEXT_PUBLIC_FACTORY_ADDRESS=0x...`
   - Or use Base Sepolia and set chain/RPC/factory in .env.

4. **Dashboard**
   ```bash
   pnpm --filter @open-wallet/dashboard dev
   ```
   Or: `cd packages/dashboard && pnpm dev`

5. Open **http://localhost:3000**

---

## 6) 60-second demo script

1. **Overview** — Open http://localhost:3000. Show AgentOS branding and "I'm the Agent" / "I'm the Human" (existing).
2. **Agents** — Click Agents → Create agent → name + owner (connect wallet to auto-fill) → Create. On agent details: Link existing wallet (address + chain ID) or "Deploy new wallet" (goes to wallets/create with returnTo).
3. **Pay** — Click Pay → Create invoice: pick agent, linked wallet, amount (e.g. 1000000000000000 wei), leave token empty for ETH → Create invoice. Copy "Open pay page" link.
4. **Pay page (public)** — Open pay link in same or new tab. Connect wallet → Pay ETH. After confirm, redirects to receipt.
5. **Receipt** — Show status Paid, tx hash, "View on explorer" (if chain has explorer).
6. **Wallets** — Click Wallets → existing list and wallet details unchanged; from agent details "View wallet" goes to same wallet detail page.

---

## Constraints respected

- No complex auth; wallet connection only.
- No MPC/TSS/AA.
- Contracts/SDK unchanged; reuse AgentWallet + Factory + SDK.
- Chain config and local Anvil unchanged.
- RainbowKit/wagmi unchanged.
- Minimal renames; UI/copy rebrand only; package names remain @open-wallet/*.
- New features additive; /wallets and /wallet/[address] kept.
