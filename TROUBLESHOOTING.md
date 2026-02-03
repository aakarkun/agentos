# Troubleshooting Guide

## pnpm install Issues

### Issue: `pnpm: command not found`

**Solution**: Install pnpm globally:
```bash
npm install -g pnpm
```

### Issue: Foundry dependencies fail during install

The contracts package tries to install OpenZeppelin dependencies via Foundry. If Foundry is not installed, this will fail.

**Solution**: 
1. Install Foundry first (see below)
2. Or skip Foundry dependencies for now - they're optional for initial setup

## Foundry Issues

### Issue: `forge: command not found`

**Solution**: Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Issue: `Library not loaded: /usr/local/opt/libusb/lib/libusb-1.0.0.dylib` (macOS)

Foundry requires libusb on macOS.

**Solution**: Install libusb via Homebrew:
```bash
brew install libusb
```

Then verify Foundry works:
```bash
forge --version
```

### Issue: OpenZeppelin dependencies not found

**Solution**: Install Foundry dependencies manually:
```bash
cd packages/contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit
```

## Dashboard Issues

### Issue: `@tanstack/react-query` not found

**Solution**: Make sure you've run `pnpm install` from the root:
```bash
cd /Users/kusgautam/open-wallet
pnpm install
```

### Issue: WalletConnect project ID missing

**Solution**: Create `.env.local` in `packages/dashboard/` (or set in root `.env`):
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

Get a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).

### Issue: "Origin http://localhost:3000 not found on Allowlist"

WalletConnect/Reown requires your app origin to be on the project allowlist.

**Solution**:
1. Go to [Reown Cloud](https://cloud.reown.com) and sign in.
2. Open your project (the one whose Project ID you use in `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`).
3. Find **Domain** (or **Allowed origins** / **Allowlist**) and add `http://localhost:3000`.
4. For production, add your app URL (e.g. `https://yourdomain.com`).
5. Save.

**If you already added the domain but still see the error:**

- **Wait up to 15 minutes** – Reown can take up to 15 minutes to apply allowlist changes. Try again after waiting.
- **Check Project ID matches** – Your `.env` must use the **exact** Project ID of the Reown project where you added the domain. In Reown Cloud, copy the full Project ID (e.g. the one shown as "Project ID e7...53") and set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to that value in `.env` or `.env.local`, then restart the dev server.
- **Hard refresh** – Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) or clear site data for `http://localhost:3000`, then reload.

## SDK Issues

### Issue: Contract ABI not found

The SDK requires the contract ABI to function fully. After deploying contracts:

1. Copy the ABI from `packages/contracts/out/AgentWallet.sol/AgentWallet.json`
2. Create `packages/sdk/src/abis/AgentWallet.json`
3. Update SDK implementation to use the ABI

## Indexer Issues

### Issue: Postgres connection failed

**Solution**: 
1. Make sure Postgres is running:
```bash
brew services start postgresql@14  # or your version
```

2. Create the database:
```bash
createdb openwallet
```

3. Set DATABASE_URL in `.env`:
```
DATABASE_URL=postgresql://localhost/openwallet
```

4. Run migrations:
```bash
cd apps/indexer
pnpm migrate
```

## General Issues

### Issue: Workspace dependencies not resolving

**Solution**: Make sure you're running commands from the monorepo root:
```bash
cd /Users/kusgautam/open-wallet
pnpm install
```

### Issue: Build scripts warning

If you see warnings about build scripts, you can approve them:
```bash
pnpm approve-builds
```

Or ignore them - they're usually safe for well-known packages.

## Getting Help

1. Check the [SETUP.md](SETUP.md) guide
2. Review [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for architecture details
3. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)
