# @agentos/sdk

TypeScript SDK for AgentOS agent wallet infrastructure.

## Installation

```bash
pnpm add @agentos/sdk viem
```

## Usage

### Initialize SDK

```typescript
import { AgentOSSDK } from '@agentos/sdk';
import { createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const sdk = new AgentOSSDK({
  walletAddress: '0x...',
  rpcUrl: 'https://sepolia.base.org',
});

// For agent operations
const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: http(),
  account: agentAccount,
});

const agent = sdk.asAgent(walletClient);
await agent.proposeTransfer(to, amount, token, contextHash);

// For human operations
const human = sdk.asHuman(walletClient);
await human.approveTransfer(proposalId);

// Policy validation
const isValid = await sdk.policy.validate(to, amount, token);
```

## API

### Agent API (`sdk.asAgent()`)

- `proposeTransfer(to, amount, token, contextHash)` - Propose a transfer
- `executeTransfer(proposalId)` - Execute an approved transfer

### Human API (`sdk.asHuman()`)

- `approveTransfer(proposalId)` - Approve a pending transfer
- `rejectTransfer(proposalId)` - Reject a pending transfer
- `setPolicy(policy)` - Update the policy
- `emergencyWithdraw(to, tokens)` - Emergency withdraw all funds
- `pauseAgent()` - Pause the agent
- `unpauseAgent()` - Unpause the agent
- `rotateAgentKey(newAgent)` - Rotate the agent key

### Policy Validator (`sdk.policy`)

- `validate(to, amount, token)` - Validate transfer against policy
- `simulateTransfer(to, amount, token)` - Pre-flight checks
- `getPolicy()` - Get current policy

### Helpers

- `waitForProposal(proposalId, targetStatus?, timeout?)` - Wait for proposal state change
- `getProposal(proposalId)` - Get proposal details
- `getBalance(token?)` - Get wallet balance
