# OpenWallet Demo Script

Run the dashboard: from repo root, `pnpm --filter @open-wallet/dashboard dev` (or `cd packages/dashboard && pnpm dev`). Open **http://localhost:3000**.

---

## 1. Landing (who are you?)

- **Open** http://localhost:3000
- **Explain:** "A shared wallet: the agent spends within limits, the human funds and approves."
- **Click** "I'm the Agent" or "I'm the Human" — the rest of the app adapts to that role.

---

## 2. Wallets (role-aware)

- **Header** shows "Viewing as Agent" or "Viewing as Human" so you always know your role.
- **Banner** explains: agents see "wallets you can spend from"; humans see "wallets you fund; you approve or reject what the agent spends."
- **If no wallets:** show the add form or "Create wallet". You can add a contract address (from a prior Foundry deploy) or go to Create wallet.
- **If you have wallets:** grid of cards (name, short address, "View"). Click **View** to open wallet details.

---

## 3. Create wallet (optional)

- **Wallets** → **Create wallet**
- **Explain:** "You're creating a shared wallet: agent can spend within limits, human funds and approves."
- **Connect** wallet (human signs and pays gas).
- **Fill:** name, agent address, human address (auto-fills when connected), max per tx, daily cap, approval above.
- **Create wallet** → tx confirms → new wallet appears in list; you can open it.

*(Requires `NEXT_PUBLIC_FACTORY_ADDRESS` set and factory deployed.)*

---

## 4. Wallet details (view + human actions)

- **Open** any wallet from the list.
- **Banner** says who you are: "You're the human for this wallet" or "You're the agent for this wallet" and what you can do.
- **Agent:** balance + spending limits; "To send money, use the SDK in your code" + link to **Skills** tab.
- **Human (connected as human):** same view + **Approve / Reject** on pending proposals, **Pause agent**, **Emergency withdraw**, **Update policy**, **Rotate agent**, human rotation.

---

## 5. Switch role

- **Switch role** (Wallets page or header) → back to landing to choose Agent or Human again. Shows how the same app changes for each role.

---

## Quick checklist

| Step | What to show |
|------|----------------|
| 1 | Landing → choose "I'm the Human" or "I'm the Agent" |
| 2 | Wallets page: role banner + "My wallets" / "Wallets I oversee" |
| 3 | Add a wallet (address + name) or Create wallet |
| 4 | Open a wallet → "You're the human/agent" line + balance, limits, (if human) approve/reject |
| 5 | Skills tab → how agents get config (curl, JSON) |
| 6 | Switch role → land again → choose other role |

---

## Demo without a deployed wallet

If you don't have a wallet contract yet:

1. **Landing** → choose role.
2. **Wallets** → show the empty state and "Add another wallet" (paste any `0x...` for demo) or "Create wallet" (needs factory).
3. **Setup** tab → show "Deploy with Foundry" steps so the audience knows how to get a real wallet.
4. **Skills** tab → show the curl install and skill list.

For a **full demo with real txs**, deploy the factory and a wallet first (see [SETUP.md](../SETUP.md) and `packages/contracts/script/`).
