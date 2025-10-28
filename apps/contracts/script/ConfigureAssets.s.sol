// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Pack1155.sol";
import "../src/Fortune721.sol";

contract ConfigureAssets is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get contract addresses from env
        address pack1155Address = vm.envAddress("PACK1155_ADDRESS");
        address fortune721Address = vm.envAddress("FORTUNE721_ADDRESS");
        
        Pack1155 pack = Pack1155(pack1155Address);
        Fortune721 fortune = Fortune721(fortune721Address);
        
        vm.startBroadcast(deployerPrivateKey);

        // ============================================
        // 1. SET CARD IMAGES (Pack1155)
        // ============================================
        
        // Option A: If you have individual metadata files for each card (0-14)
        // Format: ipfs://QmXXXXXXX/{id}.json where {id} is replaced with card ID
        pack.setURI("ipfs://YOUR_CARDS_METADATA_CID/");
        
        // Option B: If you're using a single metadata server
        // pack.setURI("https://api.yourproject.com/cards/");
        
        // ============================================
        // 2. SET FORTUNE BACKGROUND (Fortune721)
        // ============================================
        
        // Set the background image for fortune NFTs
        fortune.setBaseBgCID("QmYOUR_FORTUNE_BACKGROUND_CID");
        
        // ============================================
        // 3. SET FORTUNE FONT (Fortune721)
        // ============================================
        
        // Option A: Google Fonts URL
        fortune.setFontURI("https://fonts.googleapis.com/css2?family=Cinzel:wght@600&display=swap");
        
        // Option B: IPFS font file
        // fortune.setFontURI("ipfs://QmYOUR_FONT_FILE_CID/font.woff2");
        
        // Option C: Base64 encoded font
        // fortune.setFontURI("data:font/woff2;base64,YOUR_BASE64_FONT_DATA");

        vm.stopBroadcast();
        
        console.log("Assets configured!");
        console.log("- Pack1155 URI set");
        console.log("- Fortune721 background set");
        console.log("- Fortune721 font set");
    }
}
