# AgentOS Threat Model

This document outlines the threat model, assumptions, and invariants for AgentOS agent wallet infrastructure.

## Assumptions

1. **Agent key can be compromised** - The agent key is a "hot" key that may be exposed in runtime environments. We assume it can be compromised.

2. **Human key is colder and approval-gated** - The human key is stored more securely and is used only for approvals and emergency actions. It is not assumed to be compromised in normal operation.

3. **Middleware and dashboard are not trust anchors for custody** - The middleware (x402) and dashboard are convenience layers. They do not hold funds and are not part of the custody model.

4. **Smart contract is correct** - We assume the AgentWallet contract is correctly implemented and audited before handling real funds.

5. **Blockchain is secure** - We assume Base network security and finality.

## Invariants

These invariants must always hold:

### 1. Human Can Always Drain or Stop the Agent

- **emergencyWithdraw**: Human can withdraw all funds at any time, bypassing all policies.
- **pauseAgent**: Human can pause the agent, preventing any new proposals.
- **rotateAgentKey**: Human can rotate the agent key if compromised.

**Rationale**: This ensures human oversight is always possible, even if the agent is compromised or behaving incorrectly.

### 2. No Transfer Without Policy Compliance or Human Approval

- Transfers below the approval threshold and within policy limits can auto-execute.
- Transfers above the threshold or violating policy require human approval.
- No transfer can bypass both policy checks and approval.

**Rationale**: This ensures all transfers are either policy-compliant (auto) or explicitly approved by a human.

### 3. Middleware Never Holds Funds

- x402 middleware only verifies on-chain payments.
- Payments always go directly to the AgentWallet address.
- If middleware is hacked → nothing (no custody at risk).

**Rationale**: This keeps the custody model pure and ensures middleware compromise does not affect funds.

### 4. Policy Enforcement

- All transfers are checked against policy (maxAmount, dailyCap, allowedTargets, allowedTokens).
- Policy can only be updated by the human.
- Policy violations cause proposals to revert.

**Rationale**: This ensures spending limits and restrictions are enforced at the contract level.

## Threat Scenarios

### Agent Key Compromised

**Scenario**: Attacker gains control of the agent private key.

**Mitigations**:
- Human can pause the agent immediately (`pauseAgent`).
- Human can rotate the agent key (`rotateAgentKey`).
- Human can emergency withdraw all funds (`emergencyWithdraw`).
- Policy limits prevent large unauthorized transfers (if below threshold, still limited by maxAmount/dailyCap).

**Impact**: Limited by policy and human oversight. Funds can be recovered.

### Human Key Compromised

**Scenario**: Attacker gains control of the human private key.

**Mitigations**:
- Human key rotation has a timelock (2 days default).
- During timelock, the old human can cancel rotation.
- Agent can continue operating normally (policy-compliant transfers).

**Impact**: High - attacker can approve transfers and update policy. Timelock provides window for detection.

**Recommendation**: Use hardware wallet or multi-sig for human key.

### Middleware Compromised

**Scenario**: x402 middleware server is hacked.

**Mitigations**:
- Middleware never holds funds.
- Payments go directly to AgentWallet.
- Middleware only verifies on-chain payments.

**Impact**: Low - no funds at risk. Service disruption only.

### Smart Contract Bug

**Scenario**: Bug in AgentWallet contract allows unauthorized transfers.

**Mitigations**:
- Code review and audit before mainnet.
- Non-upgradeable contract (reduces attack surface).
- Human can emergency withdraw if bug discovered.

**Impact**: High - but mitigated by audit and emergency controls.

### Policy Bypass

**Scenario**: Attacker finds way to bypass policy checks.

**Mitigations**:
- Policy checks are enforced at contract level.
- All transfers go through `proposeTransfer` which validates policy.
- Human approval required for policy-violating transfers.

**Impact**: Low - policy is enforced in smart contract.

## What We Don't Guarantee (Yet)

These are out of scope for Phase 1 but may be addressed in future phases:

1. **Cross-chain safety** - Only Base chain supported in Phase 1.
2. **MEV protection** - No protection against MEV/front-running.
3. **Oracle/price manipulation** - No oracle integration; assumes on-chain data is correct.
4. **Reentrancy beyond standard guards** - Uses OpenZeppelin ReentrancyGuard.
5. **Upgradeability** - Contracts are non-upgradeable in Phase 1.

## Security Recommendations

1. **Use hardware wallet for human key** - Reduces risk of human key compromise.
2. **Monitor for unusual activity** - Dashboard should alert on large transfers or policy changes.
3. **Regular key rotation** - Rotate agent key periodically even if not compromised.
4. **Audit before mainnet** - External audit required before handling real funds.
5. **Start with small limits** - Begin with conservative policy limits and increase gradually.

## Incident Response

If a security incident occurs:

1. **Pause the agent immediately** - Use `pauseAgent` to stop all new proposals.
2. **Assess the situation** - Determine scope of compromise.
3. **Rotate keys if needed** - Use `rotateAgentKey` or `initiateHumanKeyRotation`.
4. **Emergency withdraw if necessary** - Use `emergencyWithdraw` to move funds to a safe address.
5. **Investigate and fix** - Identify root cause and implement fixes.

## References

- [OpenZeppelin Security Practices](https://docs.openzeppelin.com/contracts/security)
- [Base Security](https://docs.base.org/security)
- [Ethereum Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
