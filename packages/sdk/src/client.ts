import { createPublicClient, createWalletClient, http, PublicClient, WalletClient, Address, Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { AgentAPI } from './agent';
import { HumanAPI } from './human';
import { PolicyValidator } from './policy';
import { SDKConfig, Proposal, ProposalStatus } from './types';

/**
 * OpenWallet SDK Client
 */
export class OpenWalletSDK {
  public readonly walletAddress: Address;
  public readonly publicClient: PublicClient;
  public readonly chain: Chain;

  private _agent?: AgentAPI;
  private _human?: HumanAPI;
  private _policy?: PolicyValidator;

  constructor(config: SDKConfig) {
    this.walletAddress = config.walletAddress;
    
    // Determine chain
    const chainId = config.chainId || (process.env.NODE_ENV === 'production' ? base.id : baseSepolia.id);
    this.chain = chainId === base.id ? base : baseSepolia;

    // Create public client
    const rpcUrl = config.rpcUrl || this.chain.rpcUrls.default.http[0];
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(rpcUrl),
    });
  }

  /**
   * Get agent API (for agent operations)
   */
  asAgent(walletClient: WalletClient): AgentAPI {
    if (!this._agent) {
      this._agent = new AgentAPI(this.publicClient, walletClient, this.walletAddress);
    }
    return this._agent;
  }

  /**
   * Get human API (for human oversight operations)
   */
  asHuman(walletClient: WalletClient): HumanAPI {
    if (!this._human) {
      this._human = new HumanAPI(this.publicClient, walletClient, this.walletAddress);
    }
    return this._human;
  }

  /**
   * Get policy validator (client-side guardrails)
   */
  get policy(): PolicyValidator {
    if (!this._policy) {
      this._policy = new PolicyValidator(this.publicClient, this.walletAddress);
    }
    return this._policy;
  }

  /**
   * Wait for proposal state change
   */
  async waitForProposal(
    proposalId: bigint,
    targetStatus?: ProposalStatus,
    timeout = 60000
  ): Promise<Proposal> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const proposal = await this.getProposal(proposalId);
      
      if (targetStatus === undefined || proposal.status === targetStatus) {
        return proposal;
      }
      
      if (proposal.status === ProposalStatus.Executed || proposal.status === ProposalStatus.Rejected) {
        return proposal;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Timeout waiting for proposal ${proposalId}`);
  }

  /**
   * Get proposal details
   */
  async getProposal(proposalId: bigint): Promise<Proposal> {
    // This would use the contract ABI to read proposal
    // For now, returning a placeholder structure
    // In real implementation, this would call the contract
    throw new Error('Not implemented - requires contract ABI');
  }

  /**
   * Get wallet balance
   */
  async getBalance(token?: Address): Promise<bigint> {
    if (token) {
      // ERC20 balance
      throw new Error('ERC20 balance not implemented - requires contract ABI');
    } else {
      // ETH balance
      return await this.publicClient.getBalance({ address: this.walletAddress });
    }
  }
}
