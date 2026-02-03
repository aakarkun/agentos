import { PublicClient, WalletClient, Address, Hash, encodeFunctionData } from 'viem';
import { agentWalletAbi } from './abis';

type WalletClientWithAccount = WalletClient & { account: { address: Address; type?: string } };

export class AgentAPI {
  constructor(
    private publicClient: PublicClient,
    private walletClient: WalletClientWithAccount,
    private walletAddress: Address
  ) {}

  async proposeTransfer(to: Address, amount: bigint, token: Address, contextHash: Hash): Promise<bigint> {
    const account = this.walletClient.account;
    if (!account) throw new Error('Wallet client must have an account');

    const txHash = await this.walletClient.writeContract({
      address: this.walletAddress as `0x${string}`,
      abi: agentWalletAbi,
      functionName: 'proposeTransfer',
      args: [to, amount, token, contextHash],
      account,
      chain: this.walletClient.chain ?? undefined,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const proposalCounter = (await this.publicClient.readContract({
      address: this.walletAddress,
      abi: agentWalletAbi,
      functionName: 'proposalCounter',
    })) as bigint;
    return proposalCounter;
  }

  async executeTransfer(proposalId: bigint): Promise<Hash> {
    const account = this.walletClient.account;
    if (!account) throw new Error('Wallet client must have an account');

    return await this.walletClient.writeContract({
      address: this.walletAddress as `0x${string}`,
      abi: agentWalletAbi,
      functionName: 'executeTransfer',
      args: [proposalId],
      account,
      chain: this.walletClient.chain ?? undefined,
    });
  }
}
