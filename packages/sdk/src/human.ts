import { PublicClient, WalletClient, Address, Hash } from 'viem';
import { Policy } from './types';
import { agentWalletAbi } from './abis';

type WalletClientWithAccount = WalletClient & { account: { address: Address; type?: string } };

export class HumanAPI {
  constructor(
    private publicClient: PublicClient,
    private walletClient: WalletClientWithAccount,
    private walletAddress: Address
  ) {}

  private get account() {
    const a = this.walletClient.account;
    if (!a) throw new Error('Wallet client must have an account');
    return a;
  }

  private writeParams() {
    return { address: this.walletAddress as `0x${string}`, abi: agentWalletAbi, account: this.account, chain: this.walletClient.chain ?? undefined };
  }

  async approveTransfer(proposalId: bigint): Promise<Hash> {
    return await this.walletClient.writeContract({
      ...this.writeParams(),
      functionName: 'approveTransfer',
      args: [proposalId],
    });
  }

  async rejectTransfer(proposalId: bigint): Promise<Hash> {
    return await this.walletClient.writeContract({
      ...this.writeParams(),
      functionName: 'rejectTransfer',
      args: [proposalId],
    });
  }

  async setPolicy(policy: Partial<Policy>): Promise<Hash> {
    const current = (await this.publicClient.readContract({
      address: this.walletAddress,
      abi: agentWalletAbi,
      functionName: 'getPolicy',
    })) as [bigint, bigint, boolean, bigint, number, number];
    const [maxAmount, dailyCap, requiresApproval, approvalThreshold] = current;
    const targetsToAdd = policy.allowedTargets ?? [];
    const targetsToRemove: Address[] = [];
    const tokensToAdd = policy.allowedTokens ?? [];
    const tokensToRemove: Address[] = [];
    return await this.walletClient.writeContract({
      ...this.writeParams(),
      functionName: 'setPolicy',
      args: [
        policy.maxAmount ?? maxAmount,
        policy.dailyCap ?? dailyCap,
        policy.requiresApproval ?? requiresApproval,
        policy.approvalThreshold ?? approvalThreshold,
        targetsToAdd,
        targetsToRemove,
        tokensToAdd,
        tokensToRemove,
      ],
    });
  }

  async emergencyWithdraw(to: Address, tokens: Address[]): Promise<Hash> {
    return await this.walletClient.writeContract({
      ...this.writeParams(),
      functionName: 'emergencyWithdraw',
      args: [to, tokens],
    });
  }

  async pauseAgent(): Promise<Hash> {
    return await this.walletClient.writeContract({ ...this.writeParams(), functionName: 'pauseAgent' });
  }

  async unpauseAgent(): Promise<Hash> {
    return await this.walletClient.writeContract({ ...this.writeParams(), functionName: 'unpauseAgent' });
  }

  async rotateAgentKey(newAgent: Address): Promise<Hash> {
    return await this.walletClient.writeContract({
      ...this.writeParams(),
      functionName: 'rotateAgentKey',
      args: [newAgent],
    });
  }

  async initiateHumanKeyRotation(newHuman: Address): Promise<Hash> {
    return await this.walletClient.writeContract({
      ...this.writeParams(),
      functionName: 'initiateHumanKeyRotation',
      args: [newHuman],
    });
  }

  async completeHumanKeyRotation(): Promise<Hash> {
    return await this.walletClient.writeContract({
      ...this.writeParams(),
      functionName: 'completeHumanKeyRotation',
    });
  }
}
