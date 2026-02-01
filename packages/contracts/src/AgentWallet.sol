// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title AgentWallet
 * @notice Multi-sig agent wallet with policy layer, spending limits, and human oversight.
 * @dev Agents earn, humans oversee. This is agent financial governance, not just a wallet.
 */
contract AgentWallet is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    // ============ Types ============

    /**
     * @notice Policy struct defining spending rules
     * @param maxAmount Maximum amount per transfer (per-call cap)
     * @param dailyCap Maximum amount per day (0 = unlimited)
     * @param requiresApproval If true, requires human approval regardless of amount
     * @param approvalThreshold Amount above which human approval is required
     * @param allowedTargets Set of addresses agent can send to (empty = any)
     * @param allowedTokens Set of token addresses agent can use (ETH + USDC only in MVP)
     */
    struct Policy {
        uint256 maxAmount;
        uint256 dailyCap;
        bool requiresApproval;
        uint256 approvalThreshold;
        EnumerableSet.AddressSet allowedTargets;
        EnumerableSet.AddressSet allowedTokens;
    }

    /**
     * @notice Transfer proposal
     * @param id Unique proposal ID
     * @param to Recipient address
     * @param amount Amount to transfer
     * @param token Token address (address(0) for ETH)
     * @param contextHash Hash of context (URL, endpoint, invoice ID, etc.)
     * @param proposedAt Timestamp when proposed
     * @param status Proposal status
     */
    struct Proposal {
        uint256 id;
        address to;
        uint256 amount;
        address token;
        bytes32 contextHash;
        uint256 proposedAt;
        ProposalStatus status;
    }

    enum ProposalStatus {
        Pending,
        Approved,
        Rejected,
        Executed
    }

    // ============ State ============

    address public agent;
    address public human;
    Policy public policy;
    
    bool public agentPaused;
    uint256 public proposalCounter;
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => uint256) public dailySpent; // timestamp => amount spent that day
    
    // For human key rotation with timelock
    address public pendingHuman;
    uint256 public humanRotationDelay;
    uint256 public humanRotationInitiatedAt;

    // ============ Events ============

    event TransferProposed(
        uint256 indexed id,
        address indexed agent,
        address indexed to,
        uint256 amount,
        address token,
        bytes32 contextHash
    );

    event TransferApproved(uint256 indexed id, address indexed by);
    event TransferRejected(uint256 indexed id, address indexed by);
    event TransferExecuted(uint256 indexed id, address indexed to, uint256 amount, address token);

    event PolicyUpdated(bytes32 indexed policyHash);
    event AgentPaused(address indexed by);
    event AgentUnpaused(address indexed by);
    event AgentKeyRotated(address indexed oldAgent, address indexed newAgent);
    event HumanKeyRotationInitiated(address indexed oldHuman, address indexed newHuman, uint256 delay);
    event HumanKeyRotated(address indexed oldHuman, address indexed newHuman);

    // ============ Modifiers ============

    modifier onlyAgent() {
        require(msg.sender == agent, "AgentWallet: caller is not agent");
        require(!agentPaused, "AgentWallet: agent is paused");
        _;
    }

    modifier onlyHuman() {
        require(msg.sender == human, "AgentWallet: caller is not human");
        _;
    }

    modifier onlyAgentOrHuman() {
        require(msg.sender == agent || msg.sender == human, "AgentWallet: caller is not agent or human");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the AgentWallet
     * @param _agent Agent address (hot key)
     * @param _human Human address (cold/approver key)
     * @param _maxAmount Maximum amount per transfer
     * @param _dailyCap Maximum amount per day (0 = unlimited)
     * @param _approvalThreshold Amount above which approval is required
     * @param _allowedTokens Array of allowed token addresses (must include USDC)
     */
    constructor(
        address _agent,
        address _human,
        uint256 _maxAmount,
        uint256 _dailyCap,
        uint256 _approvalThreshold,
        address[] memory _allowedTokens
    ) {
        require(_agent != address(0), "AgentWallet: agent cannot be zero");
        require(_human != address(0), "AgentWallet: human cannot be zero");
        require(_agent != _human, "AgentWallet: agent and human must be different");
        require(_maxAmount > 0, "AgentWallet: maxAmount must be > 0");

        agent = _agent;
        human = _human;
        humanRotationDelay = 2 days; // Default 2-day timelock for human rotation

        // Initialize policy
        policy.maxAmount = _maxAmount;
        policy.dailyCap = _dailyCap;
        policy.requiresApproval = false;
        policy.approvalThreshold = _approvalThreshold;

        // Add allowed tokens
        for (uint256 i = 0; i < _allowedTokens.length; i++) {
            policy.allowedTokens.add(_allowedTokens[i]);
        }
        // Always allow ETH (address(0))
        policy.allowedTokens.add(address(0));
    }

    // ============ Receive ============

    receive() external payable {
        // Allow receiving ETH
    }

    // ============ Agent Functions ============

    /**
     * @notice Propose a transfer (agent only)
     * @param to Recipient address
     * @param amount Amount to transfer
     * @param token Token address (address(0) for ETH)
     * @param contextHash Hash of context (URL, endpoint, invoice ID, etc.)
     * @return proposalId The ID of the created proposal
     */
    function proposeTransfer(
        address to,
        uint256 amount,
        address token,
        bytes32 contextHash
    ) external onlyAgent nonReentrant returns (uint256 proposalId) {
        require(to != address(0), "AgentWallet: recipient cannot be zero");
        require(amount > 0, "AgentWallet: amount must be > 0");
        
        // Validate against policy
        require(amount <= policy.maxAmount, "AgentWallet: amount exceeds maxAmount");
        require(
            policy.allowedTargets.length() == 0 || policy.allowedTargets.contains(to),
            "AgentWallet: recipient not in allowedTargets"
        );
        require(
            policy.allowedTokens.contains(token),
            "AgentWallet: token not in allowedTokens"
        );

        // Check daily cap
        if (policy.dailyCap > 0) {
            uint256 today = block.timestamp / 1 days;
            require(
                dailySpent[today] + amount <= policy.dailyCap,
                "AgentWallet: would exceed daily cap"
            );
        }

        // Check if approval is required
        bool needsApproval = policy.requiresApproval || amount > policy.approvalThreshold;

        proposalId = ++proposalCounter;
        proposals[proposalId] = Proposal({
            id: proposalId,
            to: to,
            amount: amount,
            token: token,
            contextHash: contextHash,
            proposedAt: block.timestamp,
            status: needsApproval ? ProposalStatus.Pending : ProposalStatus.Approved
        });

        emit TransferProposed(proposalId, msg.sender, to, amount, token, contextHash);

        // Auto-execute if no approval needed
        if (!needsApproval) {
            _executeTransfer(proposalId);
        }
    }

    /**
     * @notice Execute an approved transfer (agent or human)
     * @param proposalId The ID of the proposal to execute
     */
    function executeTransfer(uint256 proposalId) external onlyAgentOrHuman nonReentrant {
        require(
            proposals[proposalId].status == ProposalStatus.Approved,
            "AgentWallet: proposal not approved"
        );
        _executeTransfer(proposalId);
    }

    // ============ Human Functions ============

    /**
     * @notice Approve a pending transfer (human only)
     * @param proposalId The ID of the proposal to approve
     */
    function approveTransfer(uint256 proposalId) external onlyHuman {
        require(
            proposals[proposalId].status == ProposalStatus.Pending,
            "AgentWallet: proposal not pending"
        );
        proposals[proposalId].status = ProposalStatus.Approved;
        emit TransferApproved(proposalId, msg.sender);
    }

    /**
     * @notice Reject a pending transfer (human only)
     * @param proposalId The ID of the proposal to reject
     */
    function rejectTransfer(uint256 proposalId) external onlyHuman {
        require(
            proposals[proposalId].status == ProposalStatus.Pending,
            "AgentWallet: proposal not pending"
        );
        proposals[proposalId].status = ProposalStatus.Rejected;
        emit TransferRejected(proposalId, msg.sender);
    }

    /**
     * @notice Update the policy (human only)
     * @param _maxAmount New maximum amount per transfer
     * @param _dailyCap New daily cap (0 = unlimited)
     * @param _requiresApproval Whether all transfers require approval
     * @param _approvalThreshold New approval threshold
     * @param _allowedTargetsToAdd Addresses to add to allowedTargets
     * @param _allowedTargetsToRemove Addresses to remove from allowedTargets
     * @param _allowedTokensToAdd Token addresses to add
     * @param _allowedTokensToRemove Token addresses to remove
     */
    function setPolicy(
        uint256 _maxAmount,
        uint256 _dailyCap,
        bool _requiresApproval,
        uint256 _approvalThreshold,
        address[] memory _allowedTargetsToAdd,
        address[] memory _allowedTargetsToRemove,
        address[] memory _allowedTokensToAdd,
        address[] memory _allowedTokensToRemove
    ) external onlyHuman {
        require(_maxAmount > 0, "AgentWallet: maxAmount must be > 0");
        
        policy.maxAmount = _maxAmount;
        policy.dailyCap = _dailyCap;
        policy.requiresApproval = _requiresApproval;
        policy.approvalThreshold = _approvalThreshold;

        // Update allowed targets
        for (uint256 i = 0; i < _allowedTargetsToAdd.length; i++) {
            policy.allowedTargets.add(_allowedTargetsToAdd[i]);
        }
        for (uint256 i = 0; i < _allowedTargetsToRemove.length; i++) {
            policy.allowedTargets.remove(_allowedTargetsToRemove[i]);
        }

        // Update allowed tokens (but always keep ETH)
        for (uint256 i = 0; i < _allowedTokensToAdd.length; i++) {
            policy.allowedTokens.add(_allowedTokensToAdd[i]);
        }
        for (uint256 i = 0; i < _allowedTokensToRemove.length; i++) {
            if (_allowedTokensToRemove[i] != address(0)) {
                policy.allowedTokens.remove(_allowedTokensToRemove[i]);
            }
        }
        // Ensure ETH is always allowed
        policy.allowedTokens.add(address(0));

        emit PolicyUpdated(keccak256(abi.encodePacked(_maxAmount, _dailyCap, _requiresApproval, _approvalThreshold)));
    }

    /**
     * @notice Emergency withdraw all funds (human only)
     * @param to Recipient address
     * @param tokens Array of token addresses to withdraw (empty for ETH only)
     */
    function emergencyWithdraw(address to, address[] memory tokens) external onlyHuman nonReentrant {
        require(to != address(0), "AgentWallet: recipient cannot be zero");

        // Withdraw ETH
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            (bool success, ) = to.call{value: ethBalance}("");
            require(success, "AgentWallet: ETH transfer failed");
        }

        // Withdraw ERC20 tokens
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
            if (balance > 0) {
                IERC20(tokens[i]).safeTransfer(to, balance);
            }
        }
    }

    /**
     * @notice Pause the agent (human only)
     */
    function pauseAgent() external onlyHuman {
        agentPaused = true;
        emit AgentPaused(msg.sender);
    }

    /**
     * @notice Unpause the agent (human only)
     */
    function unpauseAgent() external onlyHuman {
        agentPaused = false;
        emit AgentUnpaused(msg.sender);
    }

    /**
     * @notice Rotate the agent key (human only)
     * @param newAgent New agent address
     */
    function rotateAgentKey(address newAgent) external onlyHuman {
        require(newAgent != address(0), "AgentWallet: new agent cannot be zero");
        require(newAgent != agent, "AgentWallet: new agent must be different");
        require(newAgent != human, "AgentWallet: new agent cannot be human");
        
        address oldAgent = agent;
        agent = newAgent;
        emit AgentKeyRotated(oldAgent, newAgent);
    }

    /**
     * @notice Initiate human key rotation with timelock (human only)
     * @param newHuman New human address
     */
    function initiateHumanKeyRotation(address newHuman) external onlyHuman {
        require(newHuman != address(0), "AgentWallet: new human cannot be zero");
        require(newHuman != human, "AgentWallet: new human must be different");
        require(newHuman != agent, "AgentWallet: new human cannot be agent");
        
        pendingHuman = newHuman;
        humanRotationInitiatedAt = block.timestamp;
        emit HumanKeyRotationInitiated(human, newHuman, humanRotationDelay);
    }

    /**
     * @notice Complete human key rotation after timelock (human only)
     */
    function completeHumanKeyRotation() external onlyHuman {
        require(pendingHuman != address(0), "AgentWallet: no pending rotation");
        require(
            block.timestamp >= humanRotationInitiatedAt + humanRotationDelay,
            "AgentWallet: timelock not expired"
        );

        address oldHuman = human;
        human = pendingHuman;
        pendingHuman = address(0);
        humanRotationInitiatedAt = 0;
        emit HumanKeyRotated(oldHuman, human);
    }

    // ============ Internal Functions ============

    /**
     * @notice Internal function to execute a transfer
     * @param proposalId The ID of the proposal to execute
     */
    function _executeTransfer(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Approved, "AgentWallet: proposal not approved");

        // Update daily spent
        if (policy.dailyCap > 0) {
            uint256 today = block.timestamp / 1 days;
            dailySpent[today] += proposal.amount;
        }

        // Execute transfer
        if (proposal.token == address(0)) {
            // ETH transfer
            (bool success, ) = proposal.to.call{value: proposal.amount}("");
            require(success, "AgentWallet: ETH transfer failed");
        } else {
            // ERC20 transfer
            IERC20(proposal.token).safeTransfer(proposal.to, proposal.amount);
        }

        proposal.status = ProposalStatus.Executed;
        emit TransferExecuted(proposalId, proposal.to, proposal.amount, proposal.token);
    }

    // ============ View Functions ============

    /**
     * @notice Get policy details
     * @return maxAmount Maximum amount per transfer
     * @return dailyCap Maximum amount per day
     * @return requiresApproval Whether all transfers require approval
     * @return approvalThreshold Amount above which approval is required
     * @return allowedTargetsCount Number of allowed targets
     * @return allowedTokensCount Number of allowed tokens
     */
    function getPolicy()
        external
        view
        returns (
            uint256 maxAmount,
            uint256 dailyCap,
            bool requiresApproval,
            uint256 approvalThreshold,
            uint256 allowedTargetsCount,
            uint256 allowedTokensCount
        )
    {
        return (
            policy.maxAmount,
            policy.dailyCap,
            policy.requiresApproval,
            policy.approvalThreshold,
            policy.allowedTargets.length(),
            policy.allowedTokens.length()
        );
    }

    /**
     * @notice Get allowed targets
     * @return Array of allowed target addresses
     */
    function getAllowedTargets() external view returns (address[] memory) {
        return policy.allowedTargets.values();
    }

    /**
     * @notice Get allowed tokens
     * @return Array of allowed token addresses
     */
    function getAllowedTokens() external view returns (address[] memory) {
        return policy.allowedTokens.values();
    }

    /**
     * @notice Get proposal details
     * @param proposalId The ID of the proposal
     * @return Proposal struct
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    /**
     * @notice Get daily spent amount for a given day
     * @param day Timestamp divided by 1 day
     * @return Amount spent that day
     */
    function getDailySpent(uint256 day) external view returns (uint256) {
        return dailySpent[day];
    }
}
