// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/IBurnAdapter.sol";

/**
 * @title DeadTransfer1155
 * @notice Burns ERC1155 tokens by transferring to dead address
 * @dev Used when collection doesn't have burn() function
 */
contract DeadTransfer1155 is IBurnAdapter {
    /// @notice Target ERC1155 collection
    IERC1155 public immutable collection;

    /// @notice Dead address for burning
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    /**
     * @param _collection Address of ERC1155 collection
     */
    constructor(address _collection) {
        collection = IERC1155(_collection);
    }

    /**
     * @notice Burns ERC1155 by transferring to dead address
     * @param user Token owner (must have approved gateway)
     * @param tokenId Token ID to burn
     * @param amount Amount to burn
     */
    function burnFor(address user, uint256 tokenId, uint256 amount) external {
        // Transfer directly to dead address
        collection.safeTransferFrom(user, DEAD_ADDRESS, tokenId, amount, "");
    }
}