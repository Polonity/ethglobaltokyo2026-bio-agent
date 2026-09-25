// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {BioAgentRegistry} from "./BioAgentRegistry.sol";
import {IBioAgent} from "./interfaces/IBioAgent.sol";
import {IBioAgentRegistry} from "./interfaces/IBioAgentRegistry.sol";
import {IBioAgentWallet} from "./interfaces/IBioAgentWallet.sol";
import {IBioAgentStimulus} from "./interfaces/IBioAgentStimulus.sol";

/// @notice Experimental ERC-721 identity profile with owner-only stimulus input.
/// @dev Not an ERC-8004 implementation. Wallet references remain unverified.
contract BioAgentNFT is BioAgentRegistry, ERC721, IBioAgentStimulus {
    uint256 public constant MAX_PAYLOAD_BYTES = 2048;
    mapping(uint256 => uint256) internal _stimulusNonces;

    constructor() ERC721("Bio Agent", "BIO") {}

    function supportsInterface(bytes4 id) public view virtual override returns (bool) {
        return id == type(IBioAgent).interfaceId || id == type(IBioAgentRegistry).interfaceId
            || id == type(IBioAgentWallet).interfaceId || id == type(IBioAgentStimulus).interfaceId
            || super.supportsInterface(id);
    }

    function tokenURI(uint256 agentId) public view override returns (string memory) {
        _requireOwned(agentId);
        return _agents[agentId].metadataURI;
    }

    function _afterRegistration(uint256 agentId) internal override {
        // Registrant explicitly calls mint. No receiver callback during registration.
        _mint(msg.sender, agentId);
    }

    function stimulusNonce(uint256 agentId) external view returns (uint256) {
        _requireAgent(agentId);
        return _stimulusNonces[agentId];
    }

    function submitStimulus(uint256 agentId, uint256 expectedNonce, bytes32 schema, bytes calldata payload)
        external
    {
        _requireAgent(agentId);
        if (msg.sender != ownerOf(agentId)) revert UnauthorizedWriter(agentId, msg.sender);
        uint256 current = _stimulusNonces[agentId];
        if (expectedNonce != current) revert StimulusNonceMismatch(expectedNonce, current);
        if (schema == bytes32(0) || payload.length == 0 || payload.length > MAX_PAYLOAD_BYTES) {
            revert InvalidStimulusEnvelope();
        }
        uint256 nonce = current + 1;
        _stimulusNonces[agentId] = nonce;
        emit BioAgentStimulusAccepted(agentId, nonce, schema, msg.sender, keccak256(payload), payload);
    }

    function _update(address to, uint256 agentId, address auth) internal virtual override returns (address) {
        address from = super._update(to, agentId, auth);
        if (from != address(0)) {
            _agents[agentId].owner = to;
            address previousWallet = _wallets[agentId];
            delete _wallets[agentId];
            emit BioAgentWalletUpdated(agentId, previousWallet, address(0));
            // Even a self-transfer invalidates queued inputs. All changes precede receiver callbacks.
            _stimulusNonces[agentId]++;
            uint64 revision = _statuses[agentId].revision + 1;
            uint64 timestamp = uint64(block.timestamp);
            _statuses[agentId] = BioAgentStatus(Activity.Rest, 5000, 0, revision, timestamp);
            emit BioAgentStatusUpdated(agentId, revision, msg.sender, Activity.Rest, 5000, 0, timestamp);
        }
        return from;
    }
}
