// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/BurnRedeemGateway.sol";
import "../src/adapters/DirectBurn721.sol";

/**
 * @title ConfigureMockBurn
 * @notice Configures BurnRedeemGateway to accept burns from mock NFT
 */
contract ConfigureMockBurn is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get addresses from env
        address mockNFT = vm.envAddress("MOCK_NFT");
        address gatewayAddress = vm.envAddress("BURN_GATEWAY");

        console.log("\n=== Configuring Burn/Redeem ===");
        console.log("Mock NFT:", mockNFT);
        console.log("Gateway:", gatewayAddress);

        vm.startBroadcast(deployerPrivateKey);

        BurnRedeemGateway gateway = BurnRedeemGateway(gatewayAddress);

        // Deploy DirectBurn721 adapter for the mock NFT
        DirectBurn721 adapter = new DirectBurn721(mockNFT);
        console.log("\nDirectBurn721 adapter deployed:", address(adapter));

        // Set the adapter in the gateway
        gateway.setAdapter(mockNFT, address(adapter));
        console.log("Adapter configured for mock NFT");

        vm.stopBroadcast();

        console.log("\n=== Configuration Complete ===");
        console.log("Mock NFT:", mockNFT);
        console.log("Can now burn with: burnAndMintPack(mockNFT, tokenId, 1)");
        console.log("\nTest wallets:");
        console.log("- Wallet WITH NFT: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
        console.log("- Wallet WITHOUT NFT: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    }
}


