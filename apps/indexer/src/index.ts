import { createPublicClient, http, PublicClient, Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { Pool } from 'pg';

/**
 * Thin event indexer for OpenWallet
 * Ingestes events from AgentWallet contracts and stores them in Postgres
 */

interface IndexerConfig {
  rpcUrl: string;
  chainId: number;
  walletAddresses: Address[];
  dbUrl: string;
  startBlock?: bigint;
}

class OpenWalletIndexer {
  private publicClient: PublicClient;
  private pool: Pool;
  private config: IndexerConfig;
  private isRunning = false;

  constructor(config: IndexerConfig) {
    const chain = config.chainId === base.id ? base : baseSepolia;
    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });

    this.pool = new Pool({
      connectionString: config.dbUrl,
    });

    this.config = config;
  }

  async start() {
    if (this.isRunning) {
      console.log('Indexer already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting OpenWallet indexer...');

    // Get last indexed block
    const lastBlock = await this.getLastIndexedBlock();
    const startBlock = this.config.startBlock || lastBlock || 0n;

    console.log(`Starting from block ${startBlock}`);

    // Start indexing loop
    this.indexLoop(startBlock);
  }

  async stop() {
    this.isRunning = false;
    await this.pool.end();
    console.log('Indexer stopped');
  }

  private async indexLoop(startBlock: bigint) {
    let currentBlock = startBlock;

    while (this.isRunning) {
      try {
        const latestBlock = await this.publicClient.getBlockNumber();
        
        if (currentBlock <= latestBlock) {
          await this.indexBlockRange(currentBlock, latestBlock);
          currentBlock = latestBlock + 1n;
        } else {
          // Wait for new blocks
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error('Error in index loop:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async indexBlockRange(fromBlock: bigint, toBlock: bigint) {
    console.log(`Indexing blocks ${fromBlock} to ${toBlock}`);

    // This would use the contract ABI to filter events
    // For now, this is a placeholder structure
    
    // Events to index:
    // - TransferProposed
    // - TransferApproved
    // - TransferRejected
    // - TransferExecuted
    // - PolicyUpdated
    // - AgentPaused
    // - AgentUnpaused
    // - AgentKeyRotated
    // - HumanKeyRotationInitiated
    // - HumanKeyRotated

    // TODO: Implement actual event filtering and storage
    // This requires the contract ABI
    
    // Update last indexed block
    await this.updateLastIndexedBlock(toBlock);
  }

  private async getLastIndexedBlock(): Promise<bigint | null> {
    const result = await this.pool.query(
      'SELECT block_number FROM indexer_state ORDER BY block_number DESC LIMIT 1'
    );
    return result.rows.length > 0 ? BigInt(result.rows[0].block_number) : null;
  }

  private async updateLastIndexedBlock(blockNumber: bigint) {
    await this.pool.query(
      'INSERT INTO indexer_state (block_number, updated_at) VALUES ($1, NOW()) ON CONFLICT (id) DO UPDATE SET block_number = $1, updated_at = NOW()',
      [blockNumber.toString()]
    );
  }
}

// Main entry point
async function main() {
  const config: IndexerConfig = {
    rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
    chainId: parseInt(process.env.CHAIN_ID || '84532'), // Base Sepolia
    walletAddresses: (process.env.WALLET_ADDRESSES || '').split(',').filter(Boolean) as Address[],
    dbUrl: process.env.DATABASE_URL || 'postgresql://localhost/openwallet',
    startBlock: process.env.START_BLOCK ? BigInt(process.env.START_BLOCK) : undefined,
  };

  const indexer = new OpenWalletIndexer(config);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await indexer.stop();
    process.exit(0);
  });

  await indexer.start();
}

if (require.main === module) {
  main().catch(console.error);
}
