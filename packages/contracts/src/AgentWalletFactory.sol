// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AgentWallet} from "./AgentWallet.sol";

/**
 * @title AgentWalletFactory
 * @notice Deploys new AgentWallet instances so humans can create wallets from the app.
 */
contract AgentWalletFactory {
    event WalletCreated(address indexed wallet, address indexed agent, address indexed human);

    /**
     * @notice Deploy a new AgentWallet with the given agent, human, and policy.
     * @param agent Agent address (can spend within policy)
     * @param human Human address (oversight, approval, policy changes)
     * @param maxAmount Max amount per transfer (wei)
     * @param dailyCap Max amount per day (wei; 0 = unlimited)
     * @param approvalThreshold Amount above which human approval is required (wei)
     * @param allowedTokens Token addresses the agent can use (e.g. USDC); ETH is always allowed
     */
    function createWallet(
        address agent,
        address human,
        uint256 maxAmount,
        uint256 dailyCap,
        uint256 approvalThreshold,
        address[] calldata allowedTokens
    ) external returns (address) {
        AgentWallet wallet = new AgentWallet(
            agent,
            human,
            maxAmount,
            dailyCap,
            approvalThreshold,
            allowedTokens
        );
        address walletAddress = address(wallet);
        emit WalletCreated(walletAddress, agent, human);
        return walletAddress;
    }
}
