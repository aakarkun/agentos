import { Pool } from 'pg';

/**
 * Database migrations for OpenWallet indexer
 */

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/openwallet',
  });

  try {
    // Create proposals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        id BIGINT PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        to_address VARCHAR(42) NOT NULL,
        amount NUMERIC NOT NULL,
        token_address VARCHAR(42),
        context_hash VARCHAR(66),
        proposed_at TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL,
        approved_at TIMESTAMP,
        rejected_at TIMESTAMP,
        executed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        event_name VARCHAR(50) NOT NULL,
        proposal_id BIGINT,
        block_number BIGINT NOT NULL,
        transaction_hash VARCHAR(66) NOT NULL,
        log_index INTEGER NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexer_state table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS indexer_state (
        id INTEGER PRIMARY KEY DEFAULT 1,
        block_number BIGINT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT single_row CHECK (id = 1)
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_proposals_wallet ON proposals(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
      CREATE INDEX IF NOT EXISTS idx_events_wallet ON events(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_events_block ON events(block_number);
    `);

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate().catch(console.error);
}
