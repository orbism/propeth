// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title IRandomness
 * @notice Interface for pluggable randomness sources
 * @dev Supports both VRF and commit-reveal implementations
 */
interface IRandomness {
    /**
     * @notice Generates a pseudo-random number
     * @param salt Entropy salt for randomness generation
     * @return Random uint256 value
     */
    function draw(bytes32 salt) external view returns (uint256);
}