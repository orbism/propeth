// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/Pack1155.sol";

/**
 * @title TestMint
 * @notice Quick debug script to test minting and check balances on Anvil
 * @dev Run with: forge script script/TestMint.s.sol --rpc-url http://localhost:8545 --broadcast
 */
contract TestMint is Script {
    function run() external {
        // Load config
        address packAddress = vm.envAddress("PACK1155_ADDRESS");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);

        console.log("\n=== TestMint Debug Script ===");
        console.log("Pack1155 Address:", packAddress);
        console.log("Minter Address:", deployer);
        console.log("Minter Balance:", deployer.balance / 1e18, "ETH");

        Pack1155 pack = Pack1155(packAddress);

        // Check price
        uint256 price = pack.pricePerPack();
        console.log("\nPrice per pack:", price / 1e18, "ETH");
        require(deployer.balance >= price, "Insufficient balance");

        vm.startBroadcast(privateKey);

        // Mint pack
        console.log("\n=== Minting Pack ===");
        uint256[3] memory ids = pack.mintPack{value: price}(deployer);
        
        console.log("Minted IDs:");
        console.log("  Card 0:", ids[0]);
        console.log("  Card 1:", ids[1]);
        console.log("  Card 2:", ids[2]);

        vm.stopBroadcast();

        // Check balances immediately
        console.log("\n=== Checking Balances ===");
        for (uint256 i = 0; i < 3; i++) {
            uint256 balance = pack.balanceOf(deployer, ids[i]);
            console.log("Balance of card", ids[i], ":", balance);
            require(balance > 0, "Balance should be > 0");
        }

        // Check ALL balances (0-14)
        console.log("\n=== All Card Balances ===");
        for (uint256 i = 0; i < 15; i++) {
            uint256 balance = pack.balanceOf(deployer, i);
            if (balance > 0) {
                console.log("  Card", i, ":", balance);
            }
        }

        console.log("\n=== Success! ===");
    }
}

