// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/Pack1155.sol";
import "../src/BurnRedeemGateway.sol";
import "../src/Fortune721.sol";
import "../src/mocks/MockRandomness.sol";
import "../src/adapters/DirectBurn721.sol";
import "../src/adapters/DirectBurn1155.sol";
import "../src/adapters/DeadTransfer721.sol";
import "../src/adapters/DeadTransfer1155.sol";

/**
 * @title Deploy
 * @notice Deployment script for Bezmiar Fortune Teller contracts
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url <network> --broadcast --verify
 */
contract Deploy is Script {
    // Configuration (loaded from env)
    string public baseURI;
    uint256 public maxCardId;
    uint256 public pricePerPack;
    address public payoutAddress;
    address public royaltyReceiver;
    uint96 public royaltyBps;
    string public fortuneBaseBgCID;

    // Deployed contracts
    MockRandomness public randomness;
    Pack1155 public pack;
    BurnRedeemGateway public gateway;
    Fortune721 public fortune;

    function run() external {
        // Load config from environment
        _loadConfig();

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying from:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockRandomness
        console.log("\n=== Deploying MockRandomness ===");
        randomness = new MockRandomness();
        console.log("MockRandomness deployed at:", address(randomness));

        // 2. Deploy Pack1155
        console.log("\n=== Deploying Pack1155 ===");
        pack = new Pack1155(
            baseURI,
            maxCardId,
            pricePerPack,
            payoutAddress,
            address(randomness)
        );
        console.log("Pack1155 deployed at:", address(pack));

        // 3. Set royalty on Pack1155
        console.log("\n=== Configuring Pack1155 ===");
        pack.setRoyalty(royaltyReceiver, royaltyBps);
        console.log("Royalty set:", royaltyReceiver, royaltyBps, "bps");

        // 4. Deploy BurnRedeemGateway
        console.log("\n=== Deploying BurnRedeemGateway ===");
        gateway = new BurnRedeemGateway(address(pack));
        console.log("BurnRedeemGateway deployed at:", address(gateway));

        // 5. Deploy Fortune721
        console.log("\n=== Deploying Fortune721 ===");
        fortune = new Fortune721(fortuneBaseBgCID);
        console.log("Fortune721 deployed at:", address(fortune));

        // 6. Set royalty on Fortune721
        console.log("\n=== Configuring Fortune721 ===");
        fortune.setRoyalty(royaltyReceiver, royaltyBps);
        console.log("Royalty set:", royaltyReceiver, royaltyBps, "bps");

        vm.stopBroadcast();

        // 7. Output deployment summary
        _printDeploymentSummary();

        // 8. Save deployment addresses
        _saveDeploymentAddresses();
    }

    function _loadConfig() internal {
        // Pack1155 config
        baseURI = vm.envOr("BASE_URI", string("ipfs://placeholder/"));
        maxCardId = vm.envOr("MAX_CARD_ID", uint256(15));
        pricePerPack = vm.envOr("PRICE_PER_PACK_WEI", uint256(0.01 ether));
        payoutAddress = vm.envOr("PAYOUT_ADDRESS", msg.sender);
        
        // Royalty config
        royaltyReceiver = vm.envOr("ROYALTY_RECEIVER", msg.sender);
        royaltyBps = uint96(vm.envOr("ROYALTY_BPS", uint256(500))); // 5% default

        // Fortune721 config
        fortuneBaseBgCID = vm.envOr("FORTUNE_BASE_BG_CID", string("QmPlaceholder"));

        console.log("\n=== Configuration ===");
        console.log("Base URI:", baseURI);
        console.log("Max Card ID:", maxCardId);
        console.log("Price per Pack (wei):", pricePerPack);
        console.log("Payout Address:", payoutAddress);
        console.log("Royalty Receiver:", royaltyReceiver);
        console.log("Royalty BPS:", royaltyBps);
        console.log("Fortune Base BG CID:", fortuneBaseBgCID);
    }

    function _printDeploymentSummary() internal view {
        console.log("\n================================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("================================================");
        console.log("MockRandomness:      ", address(randomness));
        console.log("Pack1155:            ", address(pack));
        console.log("BurnRedeemGateway:   ", address(gateway));
        console.log("Fortune721:          ", address(fortune));
        console.log("================================================");
        console.log("\nNext steps:");
        console.log("1. Verify contracts on block explorer");
        console.log("2. Set up burn adapters (if needed)");
        console.log("3. Upload card assets to IPFS and set URIs");
        console.log("4. Update .env.local with deployed addresses");
        console.log("5. Test minting flow");
    }

    function _saveDeploymentAddresses() internal {
        string memory chainName = _getChainName();
        string memory outputPath = string.concat("deployments/", chainName, ".json");

        vm.writeJson(
            string(
                abi.encodePacked(
                    '{"MockRandomness":"',
                    vm.toString(address(randomness)),
                    '","Pack1155":"',
                    vm.toString(address(pack)),
                    '","BurnRedeemGateway":"',
                    vm.toString(address(gateway)),
                    '","Fortune721":"',
                    vm.toString(address(fortune)),
                    '"}'
                )
            ),
            outputPath
        );

        console.log("\nDeployment addresses saved to:", outputPath);
    }

    function _getChainName() internal view returns (string memory) {
        uint256 chainId = block.chainid;
        if (chainId == 1) return "mainnet";
        if (chainId == 11155111) return "sepolia";
        return vm.toString(chainId);
    }
}