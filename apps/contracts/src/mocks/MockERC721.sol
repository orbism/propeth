// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockERC721
 * @notice Mock ERC721 for testing burn mechanisms
 */
contract MockERC721 is ERC721 {
    uint256 private _nextTokenId;

    constructor() ERC721("Mock721", "M721") {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        return tokenId;
    }

    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }
}