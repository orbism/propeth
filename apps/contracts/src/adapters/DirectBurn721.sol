// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../interfaces/IBurnAdapter.sol";

/**
 * @title DirectBurn721
 * @notice Burns ERC721 tokens that implement a burn() function
 */
contract DirectBurn721 is IBurnAdapter {
    /// @notice Target ERC721 collection
    IERC721 public immutable collection;

    error InvalidAmount();
    error BurnFailed(string reason);

    /**
     * @param _collection Address of ERC721 collection
     */
    constructor(address _collection) {
        collection = IERC721(_collection);
    }

    /**
     * @notice Burns an ERC721 token by calling its burn function
     * @param user Token owner (must have approved gateway)
     * @param tokenId Token ID to burn
     * @param amount Must be 1 for ERC721
     */
    function burnFor(address user, uint256 tokenId, uint256 amount) external {
        if (amount != 1) revert InvalidAmount();

        // Transfer to this contract first
        collection.transferFrom(user, address(this), tokenId);

        // Call burn on the token (requires burnable interface)
        (bool success, bytes memory reason) = address(collection).call(
            abi.encodeWithSignature("burn(uint256)", tokenId)
        );
        
        if (!success) {
            // Provide more detailed error information
            string memory errorMsg = reason.length > 0 
                ? string(reason) 
                : "Burn failed: unknown reason";
            revert BurnFailed(errorMsg);
        }
    }
}