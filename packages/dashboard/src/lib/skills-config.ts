/**
 * OpenWallet skills config for agents (OpenClaw, etc.).
 * Agents can use these skills and store this config in their local config.
 */

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  type: 'read' | 'write';
}

export interface OpenWalletSkillsConfig {
  openwallet: {
    version: string;
    skills: SkillDef[];
    dashboardUrl?: string;
  };
}

export const OPENWALLET_SKILLS: SkillDef[] = [
  {
    id: 'get_balance',
    name: 'Get balance',
    description: 'Get ETH balance of a wallet',
    type: 'read',
  },
  {
    id: 'list_wallets',
    name: 'List wallets',
    description: 'List wallets you have access to',
    type: 'read',
  },
  {
    id: 'get_policy',
    name: 'Get policy',
    description: 'Get policy (limits, daily cap, approval threshold) for a wallet',
    type: 'read',
  },
  {
    id: 'get_pending_proposals',
    name: 'Get pending proposals',
    description: 'List pending transfer proposals for a wallet',
    type: 'read',
  },
  {
    id: 'propose_transfer',
    name: 'Propose transfer',
    description: 'Propose a transfer from a wallet (within policy)',
    type: 'write',
  },
  {
    id: 'approve_transfer',
    name: 'Approve transfer',
    description: 'Approve a pending transfer (human only)',
    type: 'write',
  },
  {
    id: 'reject_transfer',
    name: 'Reject transfer',
    description: 'Reject a pending transfer (human only)',
    type: 'write',
  },
];

export function buildSkillsConfig(dashboardUrl?: string): OpenWalletSkillsConfig {
  return {
    openwallet: {
      version: '1',
      skills: OPENWALLET_SKILLS,
      ...(dashboardUrl && { dashboardUrl }),
    },
  };
}
