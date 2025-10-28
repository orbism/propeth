// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Fortune721.sol";

contract ViewFortuneSVG is Script {
    function run() external view {
        address fortune721Address = vm.envOr("FORTUNE721_ADDRESS", address(0x4b6aB5F819A515382B0dEB6935D793817bB4af28));
        uint256 tokenId = vm.envOr("TOKEN_ID", uint256(0));
        
        Fortune721 fortune = Fortune721(fortune721Address);
        
        // Get the full tokenURI
        string memory uri = fortune.tokenURI(tokenId);
        
        console.log("\n=================================================");
        console.log("FORTUNE NFT #%s - FULL DATA URI", tokenId);
        console.log("=================================================\n");
        
        console.log("Copy this entire data URI and paste in browser:");
        console.log(uri);
        
        console.log("\n=================================================");
        console.log("Instructions:");
        console.log("1. Copy the data:application/json;base64,... above");
        console.log("2. Paste in browser address bar");
        console.log("3. You'll see JSON with 'image' field");
        console.log("4. Copy the 'image' value (data:image/svg+xml;base64,...)");
        console.log("5. Paste THAT in a new browser tab to see the SVG");
        console.log("=================================================\n");
        
        // Get fortune composition
        (uint256 card1, uint256 card2, uint256 card3, uint256 var1, uint256 var2, uint256 var3) = fortune.fortuneData(tokenId);
        
        console.log("Fortune composed from:");
        console.log("- Card %s (variant %s)", card1, var1);
        console.log("- Card %s (variant %s)", card2, var2);
        console.log("- Card %s (variant %s)", card3, var3);
        console.log("");
    }
}
