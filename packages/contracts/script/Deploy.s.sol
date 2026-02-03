// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentWallet} from "../src/AgentWallet.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address agent = vm.envAddress("AGENT_ADDRESS");
        address human = vm.envAddress("HUMAN_ADDRESS");
        
        // Base Sepolia USDC address (update for mainnet)
        address usdc = vm.envOr("USDC_ADDRESS", address(0x036CbD53842c5426634e7929541eC2318f3dCF7e)); // Base Sepolia
        
        // Policy parameters
        uint256 maxAmount = vm.envOr("MAX_AMOUNT", uint256(1 ether));
        uint256 dailyCap = vm.envOr("DAILY_CAP", uint256(10 ether));
        uint256 approvalThreshold = vm.envOr("APPROVAL_THRESHOLD", uint256(0.5 ether));
        
        address[] memory allowedTokens = new address[](1);
        allowedTokens[0] = usdc;

        vm.startBroadcast(deployerPrivateKey);

        AgentWallet wallet = new AgentWallet(
            agent,
            human,
            maxAmount,
            dailyCap,
            approvalThreshold,
            allowedTokens
        );

        vm.stopBroadcast();

        console.log("AgentWallet deployed at:", address(wallet));
        console.log("Agent:", agent);
        console.log("Human:", human);
    }
}
