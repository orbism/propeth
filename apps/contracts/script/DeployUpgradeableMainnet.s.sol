// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/Pack1155Upgradeable.sol";
import "../src/Fortune721Upgradeable.sol";
import "../src/BurnRedeemGateway.sol";
import "../src/mocks/MockRandomness.sol";
import "../src/adapters/DirectBurn1155.sol";
import "../src/adapters/DirectBurn721.sol";

/**
 * @title DeployUpgradeableMainnet
 * @notice Deploys UUPS upgradeable contracts with proxies to Ethereum Mainnet
 * @dev Run with: forge script script/DeployUpgradeableMainnet.s.sol --rpc-url mainnet --broadcast --verify
 *
 * IMPORTANT: Before running on mainnet:
 * 1. Update PAYOUT_ADDRESS to your production multisig/wallet
 * 2. Update PROMISE_NFT_ADDRESS to the actual "A Promise" NFT contract
 * 3. Double-check PRICE_PER_PACK
 * 4. Consider using a hardware wallet or multisig for deployment
 */
contract DeployUpgradeableMainnet is Script {
    // ============ Configuration ============
    // UPDATE THESE FOR PRODUCTION

    // New metadata CID (updated 2025-01-26)
    string constant METADATA_BASE_URI = "ipfs://bafybeiaycox2yhtj23daaicey2vfx464hhipyuxfxiscmqujjn7xte72sm/";

    // Fortune background CID
    string constant FORTUNE_BG_CID = "bafybeih3foatdgwucci5whnyhewkpc7c7w4y37birvsla6gjrdmg7d62va";

    // Payout address - UPDATE FOR PRODUCTION
    address constant PAYOUT_ADDRESS = 0x9d455AFFe240a25AdC6cD75293ca6ab2a010ab0f;

    // Price: 0.03 ETH (adjust for mainnet if needed)
    uint256 constant PRICE_PER_PACK = 30000000000000000;

    // Max card ID (15 cards: 0-14)
    uint256 constant MAX_CARD_ID = 15;

    // Royalty: 5%
    uint96 constant ROYALTY_BPS = 500;

    // "A Promise" NFT contract address on mainnet - UPDATE FOR PRODUCTION
    // Set to address(0) to skip burn adapter setup
    address constant PROMISE_NFT_ADDRESS = address(0);

    // Is the Promise NFT an ERC721 or ERC1155?
    bool constant PROMISE_IS_ERC721 = true;

    // ============ Deployed Addresses ============
    Pack1155Upgradeable public packImpl;
    ERC1967Proxy public packProxy;
    Pack1155Upgradeable public pack;

    Fortune721Upgradeable public fortuneImpl;
    ERC1967Proxy public fortuneProxy;
    Fortune721Upgradeable public fortune;

    MockRandomness public randomness;
    BurnRedeemGateway public gateway;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=================================================");
        console.log("MAINNET UUPS DEPLOYMENT");
        console.log("=================================================");
        console.log("");
        console.log("!! WARNING: This is a MAINNET deployment !!");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("Payout Address:", PAYOUT_ADDRESS);
        console.log("Price per Pack:", PRICE_PER_PACK, "wei");
        console.log("");

        // Safety check
        require(PAYOUT_ADDRESS != address(0), "PAYOUT_ADDRESS not set");
        require(deployer.balance > 0.1 ether, "Insufficient balance for deployment");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockRandomness (or use Chainlink VRF for production)
        console.log("[1/9] Deploying MockRandomness...");
        console.log("  NOTE: Consider using Chainlink VRF for production randomness");
        randomness = new MockRandomness();
        console.log("  MockRandomness:", address(randomness));

        // 2. Deploy Pack1155Upgradeable implementation
        console.log("[2/9] Deploying Pack1155Upgradeable implementation...");
        packImpl = new Pack1155Upgradeable();
        console.log("  Pack1155 Implementation:", address(packImpl));

        // 3. Deploy Pack1155 proxy and initialize
        console.log("[3/9] Deploying Pack1155 proxy...");
        bytes memory packInitData = abi.encodeWithSelector(
            Pack1155Upgradeable.initialize.selector,
            METADATA_BASE_URI,
            MAX_CARD_ID,
            PRICE_PER_PACK,
            PAYOUT_ADDRESS,
            address(randomness)
        );
        packProxy = new ERC1967Proxy(address(packImpl), packInitData);
        pack = Pack1155Upgradeable(address(packProxy));
        console.log("  Pack1155 Proxy:", address(pack));

        // 4. Deploy Fortune721Upgradeable implementation
        console.log("[4/9] Deploying Fortune721Upgradeable implementation...");
        fortuneImpl = new Fortune721Upgradeable();
        console.log("  Fortune721 Implementation:", address(fortuneImpl));

        // 5. Deploy Fortune721 proxy and initialize
        console.log("[5/9] Deploying Fortune721 proxy...");
        bytes memory fortuneInitData = abi.encodeWithSelector(
            Fortune721Upgradeable.initialize.selector,
            FORTUNE_BG_CID
        );
        fortuneProxy = new ERC1967Proxy(address(fortuneImpl), fortuneInitData);
        fortune = Fortune721Upgradeable(address(fortuneProxy));
        console.log("  Fortune721 Proxy:", address(fortune));

        // 6. Deploy BurnRedeemGateway
        console.log("[6/9] Deploying BurnRedeemGateway...");
        gateway = new BurnRedeemGateway(address(pack));
        console.log("  BurnRedeemGateway:", address(gateway));

        // 7. Configure contract linkages
        console.log("[7/9] Configuring contract linkages...");
        pack.setGateway(address(gateway));
        pack.setFortune721(address(fortune));
        fortune.setPack1155(address(pack));
        console.log("  Gateway, Fortune721, and Pack1155 linked");

        // 8. Set royalties
        console.log("[8/9] Setting royalties...");
        pack.setRoyalty(PAYOUT_ADDRESS, ROYALTY_BPS);
        fortune.setRoyalty(PAYOUT_ADDRESS, ROYALTY_BPS);
        console.log("  Royalties set to", ROYALTY_BPS, "bps");

        // 9. Load fortune texts
        console.log("[9/9] Loading fortune texts...");
        loadFortuneTexts(fortune);
        console.log("  All 90 fortune texts loaded");

        // Optional: Set up burn adapter for "A Promise" NFT
        if (PROMISE_NFT_ADDRESS != address(0)) {
            if (PROMISE_IS_ERC721) {
                DirectBurn721 adapter = new DirectBurn721(PROMISE_NFT_ADDRESS);
                gateway.setAdapter(PROMISE_NFT_ADDRESS, address(adapter));
                console.log("  DirectBurn721 adapter configured for:", PROMISE_NFT_ADDRESS);
            } else {
                DirectBurn1155 adapter = new DirectBurn1155(PROMISE_NFT_ADDRESS);
                gateway.setAdapter(PROMISE_NFT_ADDRESS, address(adapter));
                console.log("  DirectBurn1155 adapter configured for:", PROMISE_NFT_ADDRESS);
            }
        } else {
            console.log("  Skipping burn adapter (PROMISE_NFT_ADDRESS not set)");
        }

        vm.stopBroadcast();

        // Print deployment summary
        printDeploymentSummary(deployer);
    }

    function printDeploymentSummary(address deployer) internal view {
        console.log("");
        console.log("=================================================");
        console.log("MAINNET DEPLOYMENT COMPLETE");
        console.log("=================================================");
        console.log("");
        console.log("# Implementation Contracts (do not interact directly)");
        console.log("PACK1155_IMPL=%s", address(packImpl));
        console.log("FORTUNE721_IMPL=%s", address(fortuneImpl));
        console.log("");
        console.log("# Proxy Contracts (use these addresses)");
        console.log("Copy to .env.local:");
        console.log("");
        console.log("# Network");
        console.log("NEXT_PUBLIC_CHAIN_ID=1");
        console.log("NEXT_PUBLIC_CHAIN_NAME=mainnet");
        console.log("");
        console.log("# Contract Addresses (Proxies)");
        console.log("NEXT_PUBLIC_PACK1155=%s", address(pack));
        console.log("NEXT_PUBLIC_FORTUNE721=%s", address(fortune));
        console.log("NEXT_PUBLIC_BURN_GATEWAY=%s", address(gateway));
        console.log("");
        console.log("# Supporting Contracts");
        console.log("RANDOMNESS_SOURCE=%s", address(randomness));
        console.log("");
        if (PROMISE_NFT_ADDRESS != address(0)) {
            console.log("# Promise NFT");
            console.log("NEXT_PUBLIC_PROMISE_CONTRACT=%s", PROMISE_NFT_ADDRESS);
            console.log("NEXT_PUBLIC_PROMISE_TOKEN_ID=1");
            console.log("NEXT_PUBLIC_PROMISE_CHAIN_ID=1");
        }
        console.log("");
        console.log("# Payout & Pricing");
        console.log("NEXT_PUBLIC_PAYOUT_ADDRESS=%s", PAYOUT_ADDRESS);
        console.log("NEXT_PUBLIC_PRICE_PER_PACK_WEI=%s", PRICE_PER_PACK);
        console.log("NEXT_PUBLIC_PRICE_PER_PACK=0.03");
        console.log("");
        console.log("# Deployer/Owner");
        console.log("DEPLOYER=%s", deployer);
        console.log("");
        console.log("=================================================");
        console.log("");
        console.log("IMPORTANT POST-DEPLOYMENT STEPS:");
        console.log("1. Verify all contracts on Etherscan");
        console.log("2. Transfer ownership to multisig if desired");
        console.log("3. Set an admin address if desired: pack.setAdmin(addr) / fortune.setAdmin(addr)");
        console.log("4. Consider pausing until ready: pack.pause() / fortune.pause()");
        console.log("5. Test with small amounts first");
        console.log("");
    }

    function loadFortuneTexts(Fortune721Upgradeable _fortune) internal {
        // Card 0: The End
        _fortune.setFragmentText(0, 1, 0, "No ending is absolute");
        _fortune.setFragmentText(0, 1, 1, "The end can be the beginning");
        _fortune.setFragmentText(0, 2, 0, "but struggle will come to an end.");
        _fortune.setFragmentText(0, 2, 1, "before peace returns.");
        _fortune.setFragmentText(0, 3, 0, "The sadness will end.");
        _fortune.setFragmentText(0, 3, 1, "Now it's time to reflect.");

        // Card 1: Suspicion
        _fortune.setFragmentText(1, 1, 0, "Not everything is what it seems");
        _fortune.setFragmentText(1, 1, 1, "Trust your senses, but keep them sharp");
        _fortune.setFragmentText(1, 2, 0, "yet someone will be responsible.");
        _fortune.setFragmentText(1, 2, 1, "so you can see through the illusion.");
        _fortune.setFragmentText(1, 3, 0, "Find who cast shade on you.");
        _fortune.setFragmentText(1, 3, 1, "You will find your answer.");

        // Card 2: Eclipse
        _fortune.setFragmentText(2, 1, 0, "Shadows hide what you ignore");
        _fortune.setFragmentText(2, 1, 1, "Don't let your emotions cloud what's important");
        _fortune.setFragmentText(2, 2, 0, "when you witness the impossible.");
        _fortune.setFragmentText(2, 2, 1, "but don't let it cloud your judgement.");
        _fortune.setFragmentText(2, 3, 0, "Be aware.");
        _fortune.setFragmentText(2, 3, 1, "Pay attention to signs.");

        // Card 3: Tension
        _fortune.setFragmentText(3, 1, 0, "The air tightens around your thoughts");
        _fortune.setFragmentText(3, 1, 1, "Pressure builds before release");
        _fortune.setFragmentText(3, 2, 0, "until something breaks.");
        _fortune.setFragmentText(3, 2, 1, "then peace returns.");
        _fortune.setFragmentText(3, 3, 0, "Hold your ground.");
        _fortune.setFragmentText(3, 3, 1, "Breathe before you move.");

        // Card 4: Mystery
        _fortune.setFragmentText(4, 1, 0, "The unknown watches in silence");
        _fortune.setFragmentText(4, 1, 1, "Every question hides an answer");
        _fortune.setFragmentText(4, 2, 0, "while the unknown waits.");
        _fortune.setFragmentText(4, 2, 1, "until it is revealed.");
        _fortune.setFragmentText(4, 3, 0, "Don't look away.");
        _fortune.setFragmentText(4, 3, 1, "Let curiosity guide you.");

        // Card 5: Silence
        _fortune.setFragmentText(5, 1, 0, "Silence grows where truth should speak");
        _fortune.setFragmentText(5, 1, 1, "In stillness you find what words cannot say");
        _fortune.setFragmentText(5, 2, 0, "until it consumes your voice.");
        _fortune.setFragmentText(5, 2, 1, "before peace takes form.");
        _fortune.setFragmentText(5, 3, 0, "Listen to the void.");
        _fortune.setFragmentText(5, 3, 1, "Let quiet guide your thoughts.");

        // Card 6: Flicker
        _fortune.setFragmentText(6, 1, 0, "The light trembles on the edge");
        _fortune.setFragmentText(6, 1, 1, "A spark appears between thoughts");
        _fortune.setFragmentText(6, 2, 0, "before darkness claims it.");
        _fortune.setFragmentText(6, 2, 1, "until it steadies again.");
        _fortune.setFragmentText(6, 3, 0, "Blink and it's gone.");
        _fortune.setFragmentText(6, 3, 1, "Keep it alive.");

        // Card 7: Descent
        _fortune.setFragmentText(7, 1, 0, "You sink beneath what once was light");
        _fortune.setFragmentText(7, 1, 1, "Let yourself fall without fear");
        _fortune.setFragmentText(7, 2, 0, "where no one follows.");
        _fortune.setFragmentText(7, 2, 1, "until you reach understanding.");
        _fortune.setFragmentText(7, 3, 0, "Do not fight gravity.");
        _fortune.setFragmentText(7, 3, 1, "Rise when you are ready.");

        // Card 8: Fracture
        _fortune.setFragmentText(8, 1, 0, "Something within begins to split");
        _fortune.setFragmentText(8, 1, 1, "The break reveals what's real");
        _fortune.setFragmentText(8, 2, 0, "until only sharp edges remain.");
        _fortune.setFragmentText(8, 2, 1, "before the pieces fit again.");
        _fortune.setFragmentText(8, 3, 0, "Hold the fragments.");
        _fortune.setFragmentText(8, 3, 1, "Wholeness will return.");

        // Card 9: Pulse
        _fortune.setFragmentText(9, 1, 0, "The rhythm falters under strain");
        _fortune.setFragmentText(9, 1, 1, "The beat reminds you you're alive");
        _fortune.setFragmentText(9, 2, 0, "before silence wins.");
        _fortune.setFragmentText(9, 2, 1, "until calm returns.");
        _fortune.setFragmentText(9, 3, 0, "Count every breath.");
        _fortune.setFragmentText(9, 3, 1, "Follow your own rhythm.");

        // Card 10: Reflection
        _fortune.setFragmentText(10, 1, 0, "The mirror shows what you deny");
        _fortune.setFragmentText(10, 1, 1, "What you see is what you can change");
        _fortune.setFragmentText(10, 2, 0, "until the face becomes a stranger.");
        _fortune.setFragmentText(10, 2, 1, "before truth settles in.");
        _fortune.setFragmentText(10, 3, 0, "Don't look too long.");
        _fortune.setFragmentText(10, 3, 1, "Accept what looks back.");

        // Card 11: Shadow
        _fortune.setFragmentText(11, 1, 0, "The shadow moves before you do");
        _fortune.setFragmentText(11, 1, 1, "What hides in dark still follows light");
        _fortune.setFragmentText(11, 2, 0, "and it reveals what you refused to see.");
        _fortune.setFragmentText(11, 2, 1, "before fading behind you.");
        _fortune.setFragmentText(11, 3, 0, "Face it.");
        _fortune.setFragmentText(11, 3, 1, "Let it pass.");

        // Card 12: Veil
        _fortune.setFragmentText(12, 1, 0, "The veil falls between knowing and seeing");
        _fortune.setFragmentText(12, 1, 1, "The veil softens what truth cannot bear");
        _fortune.setFragmentText(12, 2, 0, "until only shapes remain.");
        _fortune.setFragmentText(12, 2, 1, "before it opens again.");
        _fortune.setFragmentText(12, 3, 0, "Look beyond it.");
        _fortune.setFragmentText(12, 3, 1, "Lift it gently.");

        // Card 13: Anchor
        _fortune.setFragmentText(13, 1, 0, "The anchor drags beneath your calm");
        _fortune.setFragmentText(13, 1, 1, "Hold steady where the storm begins");
        _fortune.setFragmentText(13, 2, 0, "and it pulls you down.");
        _fortune.setFragmentText(13, 2, 1, "until the tide turns.");
        _fortune.setFragmentText(13, 3, 0, "Cut the weight.");
        _fortune.setFragmentText(13, 3, 1, "Stay grounded.");

        // Card 14: Whisper
        _fortune.setFragmentText(14, 1, 0, "The whisper tells what you shouldn't hear");
        _fortune.setFragmentText(14, 1, 1, "A gentle voice speaks beneath thought");
        _fortune.setFragmentText(14, 2, 0, "until silence hides it again.");
        _fortune.setFragmentText(14, 2, 1, "before it fades to calm.");
        _fortune.setFragmentText(14, 3, 0, "Don't repeat it.");
        _fortune.setFragmentText(14, 3, 1, "Keep it close.");
    }
}
