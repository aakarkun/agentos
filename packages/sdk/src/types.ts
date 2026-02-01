import { Address, Hash } from 'viem';

/**
 * Policy configuration
 */
export interface Policy {
  maxAmount: bigint;
  dailyCap: bigint;
  requiresApproval: boolean;
  approvalThreshold: bigint;
  allowedTargets: Address[];
  allowedTokens: Address[];
}

/**
 * Proposal status
 */
export enum ProposalStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Executed = 3,
}

/**
 * Transfer proposal
 */
export interface Proposal {
  id: bigint;
  to: Address;
  amount: bigint;
  token: Address;
  contextHash: Hash;
  proposedAt: bigint;
  status: ProposalStatus;
}

/**
 * SDK configuration
 */
export interface SDKConfig {
  walletAddress: Address;
  rpcUrl?: string;
  chainId?: number;
}
