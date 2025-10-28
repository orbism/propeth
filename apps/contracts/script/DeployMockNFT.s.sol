// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/mocks/MockERC721.sol";

/**
 * @title DeployMockNFT
 * @notice Quick script to deploy a mock NFT for testing burn/redeem locally
 */
contract DeployMockNFT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // The wallet that will receive the test NFT
        address testWallet = vm.envOr("TEST_WALLET", address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock NFT
        MockERC721 mockNFT = new MockERC721();
        console.log("\n=== Mock NFT Deployed ===");
        console.log("MockERC721 address:", address(mockNFT));

        // Mint token to test wallet (auto-increments, will be token ID 0)
        uint256 tokenId = mockNFT.mint(testWallet);
        console.log("\nMinted token ID", tokenId, "to:", testWallet);
        console.log("Owner of token:", mockNFT.ownerOf(tokenId));

        vm.stopBroadcast();

        console.log("\n=== Setup Complete ===");
        console.log("Mock NFT Contract:", address(mockNFT));
        console.log("Wallet with NFT:", testWallet);
        console.log("Token ID:", tokenId);
        console.log("\nCopy the Mock NFT address and run:");
        console.log("MOCK_NFT=<address> forge script script/ConfigureMockBurn.s.sol --rpc-url http://127.0.0.1:8545 --broadcast");
    }
}

