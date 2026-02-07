# AgentOS Contracts

Smart contracts for AgentOS agent wallet infrastructure.

## Setup

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2

# Build
forge build

# Test
forge test
```

## Contracts

- **AgentWallet.sol**: Multi-sig agent wallet with policy layer, spending limits, and human oversight

## Networks

- Base Sepolia (testnet)
- Base Mainnet
