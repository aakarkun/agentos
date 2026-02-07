import { createPublicClient, http, PublicClient, Address, Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { AgentAPI } from './agent';
import { HumanAPI } from './human';
import { PolicyValidator } from './policy';
import { SDKConfig, Proposal, ProposalStatus } from './types';
import { agentWalletAbi } from './abis';

/**
 * AgentOS SDK Client
 */
export class AgentOSSDK {
  public readonly walletAddress: Address;
  public readonly publicClient: PublicClient;
  public readonly chain: Chain;

  private _agent?: AgentAPI;
  private _human?: HumanAPI;
  private _policy?: PolicyValidator;

  constructor(config: SDKConfig) {
    this.walletAddress = config.walletAddress;

    const chainId = config.chainId ?? (process.env.NODE_ENV === 'production' ? base.id : baseSepolia.id);
    this.chain = chainId === base.id ? base : baseSepolia;

    const rpcUrl = config.rpcUrl ?? this.chain.rpcUrls.default.http[0];
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(rpcUrl),
    });
  }

  asAgent(walletClient: { account?: { address: Address }; writeContract: unknown }): AgentAPI {
    if (!this._agent) {
      this._agent = new AgentAPI(this.publicClient, walletClient as any, this.walletAddress);
    }
    return this._agent;
  }

  asHuman(walletClient: { account?: { address: Address }; writeContract: unknown }): HumanAPI {
    if (!this._human) {
      this._human = new HumanAPI(this.publicClient, walletClient as any, this.walletAddress);
    }
    return this._human;
  }

  get policy(): PolicyValidator {
    if (!this._policy) {
      this._policy = new PolicyValidator(this.publicClient, this.walletAddress);
    }
    return this._policy;
  }

  async waitForProposal(
    proposalId: bigint,
    targetStatus?: ProposalStatus,
    timeout = 60000
  ): Promise<Proposal> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const p = await this.getProposal(proposalId);
      if (targetStatus === undefined || p.status === targetStatus) return p;
      if (p.status === ProposalStatus.Executed || p.status === ProposalStatus.Rejected) return p;
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error(`Timeout waiting for proposal ${proposalId}`);
  }

  async getProposal(proposalId: bigint): Promise<Proposal> {
    const result = (await this.publicClient.readContract({
      address: this.walletAddress,
      abi: agentWalletAbi,
      functionName: 'getProposal',
      args: [proposalId],
    })) as [bigint, Address, bigint, Address, `0x${string}`, bigint, number];
    const [id, to, amount, token, contextHash, proposedAt, status] = result;
    return {
      id,
      to,
      amount,
      token,
      contextHash,
      proposedAt,
      status: status as ProposalStatus,
    };
  }

  async getBalance(token?: Address): Promise<bigint> {
    if (token) {
      return (await this.publicClient.readContract({
        address: token,
        abi: [{ type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }],
        functionName: 'balanceOf',
        args: [this.walletAddress],
      })) as bigint;
    }
    return await this.publicClient.getBalance({ address: this.walletAddress });
  }
}

/** @deprecated Use AgentOSSDK. Kept for backward compatibility. */
export const OpenWalletSDK = AgentOSSDK;
