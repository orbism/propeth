// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../interfaces/IBurnAdapter.sol";

/**
 * @title DeadTransfer721
 * @notice Burns ERC721 tokens by transferring to dead address
 * @dev Used when collection doesn't have burn() function
 */
contract DeadTransfer721 is IBurnAdapter {
    /// @notice Target ERC721 collection
    IERC721 public immutable collection;

    /// @notice Dead address for burning
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    error InvalidAmount();

    /**
     * @param _collection Address of ERC721 collection
     */
    constructor(address _collection) {
        collection = IERC721(_collection);
    }

    /**
     * @notice Burns ERC721 by transferring to dead address
     * @param user Token owner (must have approved gateway)
     * @param tokenId Token ID to burn
     * @param amount Must be 1 for ERC721
     * @return True if burn was successful
     */
    function burnFor(address user, uint256 tokenId, uint256 amount) external returns (bool) {
        if (amount != 1) revert InvalidAmount();

        // Transfer directly to dead address
        collection.transferFrom(user, DEAD_ADDRESS, tokenId);

        return true;
    }
}