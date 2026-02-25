// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/Pack1155Upgradeable.sol";
import "../src/Fortune721Upgradeable.sol";
import "../src/BurnRedeemGateway.sol";
import "../src/mocks/MockRandomness.sol";
import "../src/adapters/DirectBurn1155.sol";

/**
 * @title DeployUpgradeableMainnet
 * @notice Deploys UUPS upgradeable contracts with proxies to Ethereum Mainnet
 * @dev Run with: forge script script/DeployUpgradeableMainnet.s.sol --rpc-url mainnet --broadcast --verify
 *
 * REQUIRED Environment variables:
 *   PRIVATE_KEY        - Deployer private key
 *
 * All other configuration is prompted interactively at runtime.
 * Press enter at any prompt to accept the default value.
 */
contract DeployUpgradeableMainnet is Script {
    // ============ Constants ============

    // New metadata CID (updated 2025-01-26)
    string constant METADATA_BASE_URI = "ipfs://bafybeiaycox2yhtj23daaicey2vfx464hhipyuxfxiscmqujjn7xte72sm/";

    // Fortune background CID
    string constant FORTUNE_BG_CID = "bafybeih3foatdgwucci5whnyhewkpc7c7w4y37birvsla6gjrdmg7d62va";

    // Max card ID (15 cards: 0-14)
    uint256 constant MAX_CARD_ID = 15;

    // ============ Runtime Configuration ============
    address public payoutAddress;
    address public royaltyReceiver;
    uint96 public royaltyBps;
    uint256 public pricePerPack;
    address public promiseNftAddress;

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

        // Interactive configuration prompts (press enter for defaults)
        string memory input;

        input = vm.prompt("Payout address (default: deployer)");
        payoutAddress = bytes(input).length == 0 ? deployer : vm.parseAddress(input);

        input = vm.prompt("Royalty receiver (default: payout address)");
        royaltyReceiver = bytes(input).length == 0 ? payoutAddress : vm.parseAddress(input);

        input = vm.prompt("Royalty BPS (default: 500)");
        royaltyBps = bytes(input).length == 0 ? 500 : uint96(vm.parseUint(input));

        input = vm.prompt("Price per pack in wei (default: 30000000000000000)");
        pricePerPack = bytes(input).length == 0 ? 30000000000000000 : vm.parseUint(input);

        input = vm.prompt("Promise NFT address (default: 0x2EaA8C468Aa638c88Bd704E3A2b03d9926F0b397)");
        promiseNftAddress = bytes(input).length == 0
            ? 0x2EaA8C468Aa638c88Bd704E3A2b03d9926F0b397
            : vm.parseAddress(input);

        console.log("=================================================");
        console.log("MAINNET UUPS DEPLOYMENT");
        console.log("=================================================");
        console.log("");
        console.log("!! WARNING: This is a MAINNET deployment !!");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("Payout Address:", payoutAddress);
        console.log("Royalty Receiver:", royaltyReceiver);
        console.log("Royalty BPS:", royaltyBps);
        console.log("Price per Pack:", pricePerPack, "wei");
        console.log("Promise NFT:", promiseNftAddress);
        console.log("");

        // Safety checks
        require(payoutAddress != address(0), "Payout address cannot be zero");
        require(deployer.balance > 0.042 ether, "Insufficient balance for deployment");

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
            pricePerPack,
            payoutAddress,
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
        pack.setRoyalty(royaltyReceiver, royaltyBps);
        fortune.setRoyalty(royaltyReceiver, royaltyBps);
        console.log("  Royalties set to", royaltyBps, "bps to", royaltyReceiver);

        // 9. Load fortune texts
        console.log("[9/9] Loading fortune texts...");
        loadFortuneTexts(fortune);
        console.log("  All 90 fortune texts loaded");

        // Deploy DirectBurn1155 adapter for "A Promise" NFT
        DirectBurn1155 adapter = new DirectBurn1155(promiseNftAddress);
        gateway.setAdapter(promiseNftAddress, address(adapter));
        console.log("  DirectBurn1155 adapter configured for:", promiseNftAddress);

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
        console.log("# Promise NFT");
        console.log("NEXT_PUBLIC_PROMISE_CONTRACT=%s", promiseNftAddress);
        console.log("NEXT_PUBLIC_PROMISE_TOKEN_ID=1");
        console.log("NEXT_PUBLIC_PROMISE_CHAIN_ID=1");
        console.log("");
        console.log("# Payout & Pricing");
        console.log("NEXT_PUBLIC_PAYOUT_ADDRESS=%s", payoutAddress);
        console.log("NEXT_PUBLIC_PRICE_PER_PACK_WEI=%s", pricePerPack);
        console.log("NEXT_PUBLIC_ROYALTY_RECEIVER=%s", royaltyReceiver);
        console.log("NEXT_PUBLIC_ROYALTY_BPS=%s", royaltyBps);
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
        // Batch all 90 fortune texts in a single transaction
        uint256[] memory cardIds = new uint256[](90);
        uint256[] memory positions = new uint256[](90);
        uint256[] memory variants = new uint256[](90);
        string[] memory texts = new string[](90);

        uint256 i = 0;

        // Card 0: The End
        (cardIds[i], positions[i], variants[i], texts[i]) = (0, 1, 0, "No ending is absolute"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (0, 1, 1, "The end can be the beginning"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (0, 2, 0, "but struggle will come to an end."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (0, 2, 1, "before peace returns."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (0, 3, 0, "The sadness will end."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (0, 3, 1, "Now it's time to reflect."); i++;

        // Card 1: Suspicion
        (cardIds[i], positions[i], variants[i], texts[i]) = (1, 1, 0, "Not everything is what it seems"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (1, 1, 1, "Trust your senses, but keep them sharp"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (1, 2, 0, "yet someone will be responsible."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (1, 2, 1, "so you can see through the illusion."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (1, 3, 0, "Find who cast shade on you."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (1, 3, 1, "You will find your answer."); i++;

        // Card 2: Eclipse
        (cardIds[i], positions[i], variants[i], texts[i]) = (2, 1, 0, "Shadows hide what you ignore"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (2, 1, 1, "Don't let your emotions cloud what's important"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (2, 2, 0, "when you witness the impossible."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (2, 2, 1, "but don't let it cloud your judgement."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (2, 3, 0, "Be aware."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (2, 3, 1, "Pay attention to signs."); i++;

        // Card 3: Tension
        (cardIds[i], positions[i], variants[i], texts[i]) = (3, 1, 0, "The air tightens around your thoughts"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (3, 1, 1, "Pressure builds before release"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (3, 2, 0, "until something breaks."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (3, 2, 1, "then peace returns."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (3, 3, 0, "Hold your ground."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (3, 3, 1, "Breathe before you move."); i++;

        // Card 4: Mystery
        (cardIds[i], positions[i], variants[i], texts[i]) = (4, 1, 0, "The unknown watches in silence"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (4, 1, 1, "Every question hides an answer"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (4, 2, 0, "while the unknown waits."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (4, 2, 1, "until it is revealed."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (4, 3, 0, "Don't look away."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (4, 3, 1, "Let curiosity guide you."); i++;

        // Card 5: Silence
        (cardIds[i], positions[i], variants[i], texts[i]) = (5, 1, 0, "Silence grows where truth should speak"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (5, 1, 1, "In stillness you find what words cannot say"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (5, 2, 0, "until it consumes your voice."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (5, 2, 1, "before peace takes form."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (5, 3, 0, "Listen to the void."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (5, 3, 1, "Let quiet guide your thoughts."); i++;

        // Card 6: Flicker
        (cardIds[i], positions[i], variants[i], texts[i]) = (6, 1, 0, "The light trembles on the edge"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (6, 1, 1, "A spark appears between thoughts"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (6, 2, 0, "before darkness claims it."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (6, 2, 1, "until it steadies again."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (6, 3, 0, "Blink and it's gone."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (6, 3, 1, "Keep it alive."); i++;

        // Card 7: Descent
        (cardIds[i], positions[i], variants[i], texts[i]) = (7, 1, 0, "You sink beneath what once was light"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (7, 1, 1, "Let yourself fall without fear"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (7, 2, 0, "where no one follows."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (7, 2, 1, "until you reach understanding."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (7, 3, 0, "Do not fight gravity."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (7, 3, 1, "Rise when you are ready."); i++;

        // Card 8: Fracture
        (cardIds[i], positions[i], variants[i], texts[i]) = (8, 1, 0, "Something within begins to split"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (8, 1, 1, "The break reveals what's real"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (8, 2, 0, "until only sharp edges remain."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (8, 2, 1, "before the pieces fit again."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (8, 3, 0, "Hold the fragments."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (8, 3, 1, "Wholeness will return."); i++;

        // Card 9: Pulse
        (cardIds[i], positions[i], variants[i], texts[i]) = (9, 1, 0, "The rhythm falters under strain"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (9, 1, 1, "The beat reminds you you're alive"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (9, 2, 0, "before silence wins."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (9, 2, 1, "until calm returns."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (9, 3, 0, "Count every breath."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (9, 3, 1, "Follow your own rhythm."); i++;

        // Card 10: Reflection
        (cardIds[i], positions[i], variants[i], texts[i]) = (10, 1, 0, "The mirror shows what you deny"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (10, 1, 1, "What you see is what you can change"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (10, 2, 0, "until the face becomes a stranger."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (10, 2, 1, "before truth settles in."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (10, 3, 0, "Don't look too long."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (10, 3, 1, "Accept what looks back."); i++;

        // Card 11: Shadow
        (cardIds[i], positions[i], variants[i], texts[i]) = (11, 1, 0, "The shadow moves before you do"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (11, 1, 1, "What hides in dark still follows light"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (11, 2, 0, "and it reveals what you refused to see."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (11, 2, 1, "before fading behind you."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (11, 3, 0, "Face it."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (11, 3, 1, "Let it pass."); i++;

        // Card 12: Veil
        (cardIds[i], positions[i], variants[i], texts[i]) = (12, 1, 0, "The veil falls between knowing and seeing"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (12, 1, 1, "The veil softens what truth cannot bear"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (12, 2, 0, "until only shapes remain."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (12, 2, 1, "before it opens again."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (12, 3, 0, "Look beyond it."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (12, 3, 1, "Lift it gently."); i++;

        // Card 13: Anchor
        (cardIds[i], positions[i], variants[i], texts[i]) = (13, 1, 0, "The anchor drags beneath your calm"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (13, 1, 1, "Hold steady where the storm begins"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (13, 2, 0, "and it pulls you down."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (13, 2, 1, "until the tide turns."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (13, 3, 0, "Cut the weight."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (13, 3, 1, "Stay grounded."); i++;

        // Card 14: Whisper
        (cardIds[i], positions[i], variants[i], texts[i]) = (14, 1, 0, "The whisper tells what you shouldn't hear"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (14, 1, 1, "A gentle voice speaks beneath thought"); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (14, 2, 0, "until silence hides it again."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (14, 2, 1, "before it fades to calm."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (14, 3, 0, "Don't repeat it."); i++;
        (cardIds[i], positions[i], variants[i], texts[i]) = (14, 3, 1, "Keep it close.");

        // Single batch call instead of 90 individual transactions
        _fortune.setFragmentTextBatch(cardIds, positions, variants, texts);
    }
}
