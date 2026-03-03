// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/Fortune721Upgradeable.sol";

/**
 * @title UpgradeFortune721
 * @notice Upgrades Fortune721 proxy to new implementation and optionally sets URIs
 * @dev Run with:
 *   THUMBNAIL_URI="https://www.thegreatpropeth.com/propeth_thumb.gif" \
 *   forge script script/UpgradeFortune721.s.sol --rpc-url mainnet --broadcast
 *
 * Environment variables:
 *   PRIVATE_KEY          - Owner private key
 *   FORTUNE721_PROXY     - Fortune721 proxy address (default: 0xcB7123C5cBfEE66d09B4e44fc9623fb1cf951364)
 *   ANIMATION_BASE_URI   - (optional) Only set if you want to change it
 *   THUMBNAIL_URI        - (optional) Static image URL for OpenSea gallery thumbnails
 */
contract UpgradeFortune721 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address proxyAddr = vm.envOr("FORTUNE721_PROXY", address(0xcB7123C5cBfEE66d09B4e44fc9623fb1cf951364));
        string memory animationURI = vm.envOr("ANIMATION_BASE_URI", string(""));
        string memory thumbnailURI = vm.envOr("THUMBNAIL_URI", string(""));

        Fortune721Upgradeable proxy = Fortune721Upgradeable(proxyAddr);

        console.log("=================================================");
        console.log("FORTUNE721 UPGRADE");
        console.log("=================================================");
        console.log("Deployer:", deployer);
        console.log("Proxy:", proxyAddr);
        if (bytes(animationURI).length > 0) console.log("Animation URI:", animationURI);
        if (bytes(thumbnailURI).length > 0) console.log("Thumbnail URI:", thumbnailURI);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy new implementation
        console.log("[1] Deploying new Fortune721Upgradeable implementation...");
        Fortune721Upgradeable newImpl = new Fortune721Upgradeable();
        console.log("  New implementation:", address(newImpl));

        // 2. Upgrade proxy to new implementation
        console.log("[2] Upgrading proxy...");
        proxy.upgradeToAndCall(address(newImpl), "");
        console.log("  Proxy upgraded");

        // 3. Set animation base URI (only if provided)
        if (bytes(animationURI).length > 0) {
            console.log("[3] Setting animation base URI...");
            proxy.setAnimationBaseURI(animationURI);
            console.log("  Animation base URI set");
        }

        // 4. Set thumbnail URI (only if provided)
        if (bytes(thumbnailURI).length > 0) {
            console.log("[4] Setting thumbnail URI...");
            proxy.setThumbnailURI(thumbnailURI);
            console.log("  Thumbnail URI set");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=================================================");
        console.log("UPGRADE COMPLETE");
        console.log("=================================================");
        console.log("New implementation:", address(newImpl));
        console.log("");
        console.log("Verify with:");
        console.log("  cast call", proxyAddr, '"tokenURI(uint256)" 0 --rpc-url mainnet');
        console.log("");
    }
}
