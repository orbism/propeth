// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/IBurnAdapter.sol";

/**
 * @title DirectBurn1155
 * @notice Burns ERC1155 tokens using Manifold's burn signature
 * @dev Manifold ERC1155 burn: burn(address account, uint256[] tokenIds, uint256[] amounts)
 */
contract DirectBurn1155 is IBurnAdapter {
    /// @notice Target ERC1155 collection
    IERC1155 public immutable collection;

    error BurnFailed(string reason);

    /**
     * @param _collection Address of ERC1155 collection
     */
    constructor(address _collection) {
        collection = IERC1155(_collection);
    }

    /**
     * @notice Burns an ERC1155 token using Manifold's array-based burn
     * @param user Token owner (must have approved gateway via setApprovalForAll)
     * @param tokenId Token ID to burn
     * @param amount Amount to burn
     */
    function burnFor(address user, uint256 tokenId, uint256 amount) external {
        // Transfer to this contract first (requires user to have approved gateway)
        collection.safeTransferFrom(user, address(this), tokenId, amount, "");

        // Build arrays for Manifold's burn signature
        uint256[] memory tokenIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        tokenIds[0] = tokenId;
        amounts[0] = amount;

        // Call Manifold's burn function: burn(address, uint256[], uint256[])
        (bool success, bytes memory reason) = address(collection).call(
            abi.encodeWithSignature(
                "burn(address,uint256[],uint256[])",
                address(this),
                tokenIds,
                amounts
            )
        );

        if (!success) {
            string memory errorMsg = reason.length > 0
                ? string(reason)
                : "Burn failed: unknown reason";
            revert BurnFailed(errorMsg);
        }
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

    /**
     * @notice Required for receiving batch ERC1155 tokens
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
