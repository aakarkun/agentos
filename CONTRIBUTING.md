# Contributing to OpenWallet

Thank you for your interest in contributing to OpenWallet!

## Development Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd open-wallet
```

2. Install dependencies:
```bash
pnpm install
```

3. Install Foundry (for contracts):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

4. Install contract dependencies:
```bash
cd packages/contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit
```

5. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

## Project Structure

- `packages/contracts/` - Solidity contracts (Foundry)
- `packages/sdk/` - TypeScript SDK
- `packages/dashboard/` - Next.js dashboard
- `apps/indexer/` - Event indexer
- `docs/` - Documentation

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests:
   - Contracts: `cd packages/contracts && forge test`
   - SDK: `cd packages/sdk && pnpm test`
   - Dashboard: `cd packages/dashboard && pnpm build`
4. Commit with clear messages
5. Open a pull request

## Code Style

- **Solidity**: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- **TypeScript**: Use ESLint and Prettier (when added)
- **Commits**: Use conventional commits format (`type(scope): description`). Use **lowercase** for the description and body (e.g. `docs: add step0 repo scan` not `Add STEP0`). Exceptions: proper nouns, acronyms, or literal code.

## Testing

- Contracts: Write Foundry tests for all new functionality
- SDK: Add unit tests for new API methods
- Dashboard: Test UI changes manually (E2E tests can be added later)

## Security

- Never commit private keys or secrets
- Review security implications of changes
- See [THREAT_MODEL.md](docs/THREAT_MODEL.md) for security considerations

## Questions?

Open an issue or reach out to the maintainers.
