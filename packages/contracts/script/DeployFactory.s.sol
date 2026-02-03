// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentWalletFactory} from "../src/AgentWalletFactory.sol";

contract DeployFactoryScript is Script {
    function run() external {
        vm.startBroadcast();
        AgentWalletFactory factory = new AgentWalletFactory();
        vm.stopBroadcast();
        console.log("AgentWalletFactory deployed at:", address(factory));
    }
}
