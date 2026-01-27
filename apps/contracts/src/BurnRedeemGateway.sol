// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IBurnAdapter.sol";
import "./Pack1155.sol";

/**
 * @title BurnRedeemGateway
 * @notice Gateway for burning external NFTs to redeem Pack1155 cards
 * @dev Supports pluggable burn adapters per collection
 */
contract BurnRedeemGateway is Ownable, ReentrancyGuard, Pausable {
    /// @notice Pack1155 contract to mint from
    Pack1155 public immutable pack;

    /// @notice Mapping of collection address to burn adapter
    mapping(address => IBurnAdapter) public adapters;

    /// @notice Emitted when a token is burned and pack is minted
    event BurnedForPack(
        address indexed user,
        address indexed collection,
        uint256 tokenId,
        uint256 amount
    );

    /// @notice Emitted when an adapter is set
    event AdapterSet(address indexed collection, address indexed adapter);

    error NoAdapterSet(address collection);
    error InvalidPack();
    error BurnFailed();

    /**
     * @param _pack Address of Pack1155 contract
     */
    constructor(address _pack) Ownable(msg.sender) {
        if (_pack == address(0)) revert InvalidPack();
        pack = Pack1155(_pack);
    }

    /**
     * @notice Burns external NFT and mints a pack to sender
     * @param collection Address of external NFT collection
     * @param tokenId Token ID to burn
     * @param amount Amount to burn (1 for ERC721, n for ERC1155)
     */
    function burnAndMintPack(
        address collection,
        uint256 tokenId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        IBurnAdapter adapter = adapters[collection];
        if (address(adapter) == address(0)) revert NoAdapterSet(collection);

        // Burn the token via adapter and verify success
        bool success = adapter.burnFor(msg.sender, tokenId, amount);
        if (!success) revert BurnFailed();

        // Mint pack to user (free - gateway privilege)
        pack.mintPackFree(msg.sender);

        emit BurnedForPack(msg.sender, collection, tokenId, amount);
    }

    /**
     * @notice Sets burn adapter for a collection
     * @param collection Address of NFT collection
     * @param adapter Address of burn adapter
     */
    function setAdapter(address collection, address adapter) external onlyOwner {
        adapters[collection] = IBurnAdapter(adapter);
        emit AdapterSet(collection, adapter);
    }

    /**
     * @notice Sets multiple adapters at once
     * @param collections Array of collection addresses
     * @param _adapters Array of adapter addresses
     */
    function setAdapterBatch(
        address[] calldata collections,
        address[] calldata _adapters
    ) external onlyOwner {
        require(collections.length == _adapters.length, "Length mismatch");

        for (uint256 i = 0; i < collections.length; i++) {
            adapters[collections[i]] = IBurnAdapter(_adapters[i]);
            emit AdapterSet(collections[i], _adapters[i]);
        }
    }

    /**
     * @notice Removes adapter for a collection
     * @param collection Address of NFT collection
     */
    function removeAdapter(address collection) external onlyOwner {
        delete adapters[collection];
        emit AdapterSet(collection, address(0));
    }

    /**
     * @notice Pauses the gateway
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the gateway
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}