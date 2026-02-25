// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/Fortune721Upgradeable.sol";

/**
 * @title UpgradeFortune721
 * @notice Upgrades Fortune721 proxy to new implementation and sets animation base URI
 * @dev Run with:
 *   forge script script/UpgradeFortune721.s.sol --rpc-url mainnet --broadcast
 *
 * Environment variables:
 *   PRIVATE_KEY          - Owner private key
 *   FORTUNE721_PROXY     - Fortune721 proxy address (default: 0xcB7123C5cBfEE66d09B4e44fc9623fb1cf951364)
 *   ANIMATION_BASE_URI   - IPFS URI for the HTML viewer (e.g. ipfs://<cid>/fortune-viewer.html)
 */
contract UpgradeFortune721 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address proxyAddr = vm.envOr("FORTUNE721_PROXY", address(0xcB7123C5cBfEE66d09B4e44fc9623fb1cf951364));
        string memory animationURI = vm.envString("ANIMATION_BASE_URI");

        Fortune721Upgradeable proxy = Fortune721Upgradeable(proxyAddr);

        console.log("=================================================");
        console.log("FORTUNE721 UPGRADE");
        console.log("=================================================");
        console.log("Deployer:", deployer);
        console.log("Proxy:", proxyAddr);
        console.log("Animation URI:", animationURI);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy new implementation
        console.log("[1/3] Deploying new Fortune721Upgradeable implementation...");
        Fortune721Upgradeable newImpl = new Fortune721Upgradeable();
        console.log("  New implementation:", address(newImpl));

        // 2. Upgrade proxy to new implementation
        console.log("[2/3] Upgrading proxy...");
        proxy.upgradeToAndCall(address(newImpl), "");
        console.log("  Proxy upgraded");

        // 3. Set animation base URI
        console.log("[3/3] Setting animation base URI...");
        proxy.setAnimationBaseURI(animationURI);
        console.log("  Animation base URI set");

        vm.stopBroadcast();

        console.log("");
        console.log("=================================================");
        console.log("UPGRADE COMPLETE");
        console.log("=================================================");
        console.log("New implementation:", address(newImpl));
        console.log("Animation URI:", animationURI);
        console.log("");
        console.log("Verify with:");
        console.log("  cast call", proxyAddr, '"tokenURI(uint256)" 0 --rpc-url mainnet');
        console.log("");
    }
}
