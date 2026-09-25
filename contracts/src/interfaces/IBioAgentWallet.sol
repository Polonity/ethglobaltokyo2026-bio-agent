// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Owner-declared wallet association; not proof of wallet control or execution authority.
interface IBioAgentWallet {
    event BioAgentWalletUpdated(
        uint256 indexed agentId, address indexed previousWallet, address indexed smartWallet
    );
    function getAgentWallet(uint256 agentId) external view returns (address);
    function setAgentWallet(uint256 agentId, address smartWallet) external;
}
