// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BioAgentNFT} from "./BioAgentNFT.sol";

interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

/// @notice Permanently locked identity. No unlock, burn, or recovery in this reference profile.
contract BioAgentSBT is BioAgentNFT, IERC5192 {
    error Soulbound(uint256 agentId);

    function supportsInterface(bytes4 id) public view override returns (bool) {
        return id == type(IERC5192).interfaceId || super.supportsInterface(id);
    }

    function locked(uint256 agentId) external view returns (bool) {
        _requireOwned(agentId);
        return true;
    }

    function _update(address to, uint256 agentId, address auth) internal override returns (address) {
        if (_ownerOf(agentId) != address(0)) revert Soulbound(agentId);
        address from = super._update(to, agentId, auth);
        emit Locked(agentId);
        return from;
    }
}
