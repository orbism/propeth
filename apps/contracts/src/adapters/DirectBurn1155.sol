// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/IBurnAdapter.sol";

/**
 * @title DirectBurn1155
 * @notice Burns ERC1155 tokens that implement a burn() function
 */
contract DirectBurn1155 is IBurnAdapter {
    /// @notice Target ERC1155 collection
    IERC1155 public immutable collection;

    /**
     * @param _collection Address of ERC1155 collection
     */
    constructor(address _collection) {
        collection = IERC1155(_collection);
    }

    /**
     * @notice Burns ERC1155 tokens by calling their burn function
     * @param user Token owner (must have approved gateway)
     * @param tokenId Token ID to burn
     * @param amount Amount to burn
     */
    function burnFor(address user, uint256 tokenId, uint256 amount) external {
        // Transfer to this contract first
        collection.safeTransferFrom(user, address(this), tokenId, amount, "");

        // Call burn on the token (requires burnable interface)
        (bool success, ) = address(collection).call(
            abi.encodeWithSignature("burn(address,uint256,uint256)", address(this), tokenId, amount)
        );
        require(success, "Burn failed");
    }

    /**
     * @notice Required for receiving ERC1155 tokens
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
}