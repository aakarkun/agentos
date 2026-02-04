const path = require('path');
const fs = require('fs');

/** Load .env from packages/contracts so the dashboard uses the same real keys as Foundry/deploy. */
function loadContractsEnv() {
  const contractsEnv = path.resolve(__dirname, '../contracts/.env');
  if (!fs.existsSync(contractsEnv)) return;
  const content = fs.readFileSync(contractsEnv, 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    vars[key] = value;
    if (key.startsWith('NEXT_PUBLIC_') || key === 'SUPABASE_URL' || key === 'SUPABASE_ANON_KEY') {
      process.env[key] = value;
    }
  }
  // Map contract keys to dashboard NEXT_PUBLIC_* so one .env in contracts is enough
  if (vars.AGENT_ADDRESS && !process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESSES) {
    process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESSES = vars.AGENT_ADDRESS;
  }
  if (vars.RPC_URL && !process.env.NEXT_PUBLIC_RPC_URL) {
    process.env.NEXT_PUBLIC_RPC_URL = vars.RPC_URL;
  }
  if (vars.CHAIN_ID && !process.env.NEXT_PUBLIC_CHAIN_ID) {
    process.env.NEXT_PUBLIC_CHAIN_ID = vars.CHAIN_ID;
  }
  if (vars.FACTORY_ADDRESS && !process.env.NEXT_PUBLIC_FACTORY_ADDRESS) {
    process.env.NEXT_PUBLIC_FACTORY_ADDRESS = vars.FACTORY_ADDRESS;
  }
}
loadContractsEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@open-wallet/sdk'],
};

module.exports = nextConfig;
