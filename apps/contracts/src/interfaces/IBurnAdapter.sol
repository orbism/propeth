// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title IBurnAdapter
 * @notice Interface for burn/redeem adapters
 * @dev Supports different burn mechanisms for ERC721/1155
 */
interface IBurnAdapter {
    /**
     * @notice Burns or escrows a token on behalf of a user
     * @param user Address of the token owner
     * @param tokenId Token ID (for ERC721) or ID (for ERC1155)
     * @param amount Amount to burn (1 for ERC721, n for ERC1155)
     * @return success True if burn was successful
     */
    function burnFor(address user, uint256 tokenId, uint256 amount) external returns (bool success);
}