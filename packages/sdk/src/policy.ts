import { PublicClient, Address } from 'viem';
import { Policy } from './types';
import { agentWalletAbi } from './abis';

export class PolicyValidator {
  constructor(
    private publicClient: PublicClient,
    private walletAddress: Address
  ) {}

  async getPolicy(): Promise<Policy> {
    const result = (await this.publicClient.readContract({
      address: this.walletAddress,
      abi: agentWalletAbi,
      functionName: 'getPolicy',
    })) as [bigint, bigint, boolean, bigint, number, number];
    const [maxAmount, dailyCap, requiresApproval, approvalThreshold] = result;
    const allowedTargets = (await this.publicClient.readContract({
      address: this.walletAddress,
      abi: agentWalletAbi,
      functionName: 'getAllowedTargets',
    })) as Address[];
    const allowedTokens = (await this.publicClient.readContract({
      address: this.walletAddress,
      abi: agentWalletAbi,
      functionName: 'getAllowedTokens',
    })) as Address[];
    return {
      maxAmount,
      dailyCap,
      requiresApproval,
      approvalThreshold,
      allowedTargets,
      allowedTokens,
    };
  }

  async validate(to: Address, amount: bigint, token: Address): Promise<{ valid: boolean; reason?: string }> {
    const policy = await this.getPolicy();
    if (amount > policy.maxAmount) return { valid: false, reason: 'Amount exceeds maxAmount' };
    if (policy.allowedTargets.length > 0 && !policy.allowedTargets.includes(to)) return { valid: false, reason: 'Recipient not in allowedTargets' };
    if (!policy.allowedTokens.includes(token)) return { valid: false, reason: 'Token not in allowedTokens' };
    if (policy.dailyCap > 0n) {
      const today = BigInt(Math.floor(Date.now() / 86400000));
      const spent = (await this.publicClient.readContract({
        address: this.walletAddress,
        abi: agentWalletAbi,
        functionName: 'getDailySpent',
        args: [today],
      })) as bigint;
      if (spent + amount > policy.dailyCap) return { valid: false, reason: 'Would exceed daily cap' };
    }
    return { valid: true };
  }

  async simulateTransfer(
    to: Address,
    amount: bigint,
    token: Address
  ): Promise<{ allowed: boolean; needsApproval: boolean; reason?: string }> {
    const v = await this.validate(to, amount, token);
    if (!v.valid) return { allowed: false, needsApproval: false, reason: v.reason };
    const policy = await this.getPolicy();
    const needsApproval = policy.requiresApproval || amount > policy.approvalThreshold;
    return { allowed: true, needsApproval };
  }
}
