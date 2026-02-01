// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AgentWallet} from "../src/AgentWallet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock ERC20 token for testing
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}

contract AgentWalletTest is Test {
    AgentWallet public wallet;
    MockERC20 public token;
    
    address public agent = address(0x1);
    address public human = address(0x2);
    address public recipient = address(0x3);
    
    uint256 public constant MAX_AMOUNT = 1 ether;
    uint256 public constant DAILY_CAP = 10 ether;
    uint256 public constant APPROVAL_THRESHOLD = 0.5 ether;

    function setUp() public {
        vm.deal(address(this), 100 ether);
        vm.deal(agent, 10 ether);
        vm.deal(human, 10 ether);
        vm.deal(recipient, 1 ether);

        // Deploy mock token
        token = new MockERC20();
        token.mint(address(this), 100 ether);

        // Deploy wallet
        address[] memory allowedTokens = new address[](1);
        allowedTokens[0] = address(token);

        wallet = new AgentWallet(
            agent,
            human,
            MAX_AMOUNT,
            DAILY_CAP,
            APPROVAL_THRESHOLD,
            allowedTokens
        );

        // Fund wallet
        vm.deal(address(wallet), 20 ether);
        token.mint(address(wallet), 20 ether);
    }

    function test_Initialization() public {
        assertEq(wallet.agent(), agent);
        assertEq(wallet.human(), human);
        assertFalse(wallet.agentPaused());
        
        (uint256 maxAmount, uint256 dailyCap, bool requiresApproval, uint256 approvalThreshold,,) = wallet.getPolicy();
        assertEq(maxAmount, MAX_AMOUNT);
        assertEq(dailyCap, DAILY_CAP);
        assertFalse(requiresApproval);
        assertEq(approvalThreshold, APPROVAL_THRESHOLD);
    }

    function test_ProposeTransfer_AutoExecute() public {
        uint256 amount = 0.1 ether; // Below approval threshold
        
        vm.prank(agent);
        uint256 proposalId = wallet.proposeTransfer(
            recipient,
            amount,
            address(0),
            keccak256("test-context")
        );

        // Should auto-execute
        AgentWallet.Proposal memory proposal = wallet.getProposal(proposalId);
        assertEq(uint256(proposal.status), uint256(AgentWallet.ProposalStatus.Executed));
        assertEq(recipient.balance, 1 ether + amount);
    }

    function test_ProposeTransfer_RequiresApproval() public {
        uint256 amount = 1 ether; // Above approval threshold
        
        vm.prank(agent);
        uint256 proposalId = wallet.proposeTransfer(
            recipient,
            amount,
            address(0),
            keccak256("test-context")
        );

        // Should be pending
        AgentWallet.Proposal memory proposal = wallet.getProposal(proposalId);
        assertEq(uint256(proposal.status), uint256(AgentWallet.ProposalStatus.Pending));
    }

    function test_ApproveAndExecute() public {
        uint256 amount = 1 ether;
        
        vm.prank(agent);
        uint256 proposalId = wallet.proposeTransfer(
            recipient,
            amount,
            address(0),
            keccak256("test-context")
        );

        vm.prank(human);
        wallet.approveTransfer(proposalId);

        vm.prank(agent);
        wallet.executeTransfer(proposalId);

        AgentWallet.Proposal memory proposal = wallet.getProposal(proposalId);
        assertEq(uint256(proposal.status), uint256(AgentWallet.ProposalStatus.Executed));
        assertEq(recipient.balance, 1 ether + amount);
    }

    function test_RejectTransfer() public {
        uint256 amount = 1 ether;
        
        vm.prank(agent);
        uint256 proposalId = wallet.proposeTransfer(
            recipient,
            amount,
            address(0),
            keccak256("test-context")
        );

        vm.prank(human);
        wallet.rejectTransfer(proposalId);

        AgentWallet.Proposal memory proposal = wallet.getProposal(proposalId);
        assertEq(uint256(proposal.status), uint256(AgentWallet.ProposalStatus.Rejected));
    }

    function test_PauseAgent() public {
        vm.prank(human);
        wallet.pauseAgent();
        
        assertTrue(wallet.agentPaused());
        
        // Agent should not be able to propose when paused
        vm.prank(agent);
        vm.expectRevert("AgentWallet: agent is paused");
        wallet.proposeTransfer(recipient, 0.1 ether, address(0), keccak256("test"));
    }

    function test_UnpauseAgent() public {
        vm.prank(human);
        wallet.pauseAgent();
        
        vm.prank(human);
        wallet.unpauseAgent();
        
        assertFalse(wallet.agentPaused());
        
        // Agent should be able to propose again
        vm.prank(agent);
        wallet.proposeTransfer(recipient, 0.1 ether, address(0), keccak256("test"));
    }

    function test_RotateAgentKey() public {
        address newAgent = address(0x4);
        
        vm.prank(human);
        wallet.rotateAgentKey(newAgent);
        
        assertEq(wallet.agent(), newAgent);
        
        // New agent should be able to propose
        vm.prank(newAgent);
        wallet.proposeTransfer(recipient, 0.1 ether, address(0), keccak256("test"));
    }

    function test_EmergencyWithdraw() public {
        uint256 ethBalance = address(wallet).balance;
        uint256 tokenBalance = token.balanceOf(address(wallet));
        
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        
        vm.prank(human);
        wallet.emergencyWithdraw(recipient, tokens);
        
        assertEq(recipient.balance, 1 ether + ethBalance);
        assertEq(token.balanceOf(recipient), tokenBalance);
        assertEq(address(wallet).balance, 0);
        assertEq(token.balanceOf(address(wallet)), 0);
    }

    function test_DailyCap() public {
        // Set daily cap to 1 ether
        vm.prank(human);
        wallet.setPolicy(
            1 ether,
            1 ether, // daily cap
            false,
            APPROVAL_THRESHOLD,
            new address[](0),
            new address[](0),
            new address[](0),
            new address[](0)
        );

        // First transfer should succeed
        vm.prank(agent);
        wallet.proposeTransfer(recipient, 0.5 ether, address(0), keccak256("test1"));

        // Second transfer should fail (exceeds daily cap)
        vm.prank(agent);
        vm.expectRevert("AgentWallet: would exceed daily cap");
        wallet.proposeTransfer(recipient, 0.6 ether, address(0), keccak256("test2"));
    }

    function test_AllowedTargets() public {
        address[] memory targets = new address[](1);
        targets[0] = recipient;
        
        vm.prank(human);
        wallet.setPolicy(
            MAX_AMOUNT,
            DAILY_CAP,
            false,
            APPROVAL_THRESHOLD,
            targets, // add allowed target
            new address[](0),
            new address[](0),
            new address[](0)
        );

        // Transfer to allowed target should succeed
        vm.prank(agent);
        wallet.proposeTransfer(recipient, 0.1 ether, address(0), keccak256("test"));

        // Transfer to non-allowed target should fail
        address otherRecipient = address(0x5);
        vm.prank(agent);
        vm.expectRevert("AgentWallet: recipient not in allowedTargets");
        wallet.proposeTransfer(otherRecipient, 0.1 ether, address(0), keccak256("test"));
    }

    function test_ContextHash() public {
        bytes32 contextHash = keccak256("https://api.example.com/endpoint?price=100");
        
        vm.prank(agent);
        uint256 proposalId = wallet.proposeTransfer(
            recipient,
            0.1 ether,
            address(0),
            contextHash
        );

        AgentWallet.Proposal memory proposal = wallet.getProposal(proposalId);
        assertEq(proposal.contextHash, contextHash);
    }
}
