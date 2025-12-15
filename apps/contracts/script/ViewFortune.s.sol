// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Fortune721.sol";

contract ViewFortune is Script {
    function run() external view {
        // Get the Fortune721 address from env or use default
        address fortune721Address = vm.envOr("FORTUNE721_ADDRESS", address(0x4b6aB5F819A515382B0dEB6935D793817bB4af28));
        
        // Token ID to view (can be passed as env var)
        uint256 tokenId = vm.envOr("TOKEN_ID", uint256(0));
        
        Fortune721 fortune = Fortune721(fortune721Address);
        
        // Get the tokenURI which contains the SVG
        string memory uri = fortune.tokenURI(tokenId);
        
        console.log("\n=================================================");
        console.log("FORTUNE NFT #%s", tokenId);
        console.log("=================================================\n");
        
        // The URI is a data URI with base64 encoded JSON
        // It starts with "data:application/json;base64,"
        console.log("Full Token URI (copy and paste in browser):");
        console.log(uri);
        
        console.log("\n=================================================");
        console.log("To view:");
        console.log("1. Copy the full URI above");
        console.log("2. Paste in browser address bar");
        console.log("3. You'll see the JSON with 'image' field");
        console.log("4. Copy the 'image' value and paste in browser");
        console.log("=================================================\n");
        
        // Also get the fortune data
        (uint256 card1, uint256 card2, uint256 card3, uint256 var1, uint256 var2, uint256 var3) = fortune.fortuneData(tokenId);
        
        console.log("Fortune composed from:");
        console.log("- Card %s (variant %s)", card1, var1);
        console.log("- Card %s (variant %s)", card2, var2);
        console.log("- Card %s (variant %s)", card3, var3);
    }
}
