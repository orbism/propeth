// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../interfaces/IRandomness.sol";

/**
 * @title MockRandomness
 * @notice Mock randomness source for testing
 */
contract MockRandomness is IRandomness {
    /**
     * @notice Generates pseudo-random number from salt
     * @param salt Entropy salt
     * @return Random uint256
     */
    function draw(bytes32 salt) external view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(salt, block.timestamp, block.prevrandao)));
    }
}