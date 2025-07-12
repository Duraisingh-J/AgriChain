// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Agent Access Control Contract
/// @notice Allows users (farmers/buyers) to approve or revoke AI agents or delegates.

contract AgentAccess {
    // user => agent => isApproved
    mapping(address => mapping(address => bool)) public approvedAgents;

    event AgentApproved(address indexed user, address indexed agent);
    event AgentRevoked(address indexed user, address indexed agent);

    /// @notice Approve an agent to act on your behalf
    function approveAgent(address agent) external {
        approvedAgents[msg.sender][agent] = true;
        emit AgentApproved(msg.sender, agent);
    }

    /// @notice Revoke an agent’s access
    function revokeAgent(address agent) external {
        approvedAgents[msg.sender][agent] = false;
        emit AgentRevoked(msg.sender, agent);
    }

    /// @notice Check if a given agent is approved for a user
    function isAgentApproved(address user, address agent) external view returns (bool) {
        return approvedAgents[user][agent];
    }

    /// @notice Optional modifier to restrict functions to only approved agents
    modifier onlyApproved(address user) {
        require(approvedAgents[user][msg.sender], "Not an approved agent");
        _;
    }
}
