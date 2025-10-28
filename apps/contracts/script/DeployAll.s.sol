// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Pack1155.sol";
import "../src/Fortune721.sol";
import "../src/BurnRedeemGateway.sol";
import "../src/mocks/MockRandomness.sol";
import "../src/mocks/MockERC721.sol";
import "../src/adapters/DirectBurn721.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockRandomness
        MockRandomness randomness = new MockRandomness();
        
        // 2. Deploy Pack1155
        Pack1155 pack = new Pack1155(
            "ipfs://bafybeif7pvyusbmmzoqhnsoafbh4zmys2myskgche7zxnia2svwp7ap5w4/",  // baseURI
            15,                      // maxCardId (0-14)
            30000000000000000,       // pricePerPack (0.03 ETH)
            deployer,                // payoutAddress
            address(randomness)      // randomnessSource
        );
        
        // 3. Deploy Fortune721
        Fortune721 fortune = new Fortune721(
            "bafybeih3foatdgwucci5whnyhewkpc7c7w4y37birvsla6gjrdmg7d62va"  // baseBgCID
        );
        
        // 4. Deploy BurnRedeemGateway
        BurnRedeemGateway gateway = new BurnRedeemGateway(address(pack));
        
        // 5. Set gateway on Pack1155
        pack.setGateway(address(gateway));
        
        // 6. Deploy MockNFT ("A Promise")
        MockERC721 mockNFT = new MockERC721();
        uint256 tokenId = mockNFT.mint(deployer);
        
        // 7. Deploy DirectBurn721 adapter
        DirectBurn721 adapter = new DirectBurn721(address(mockNFT));
        
        // 8. Configure gateway with adapter
        gateway.setAdapter(address(mockNFT), address(adapter));

        vm.stopBroadcast();

        // Output in clean format
        console.log("\n=================================================");
        console.log("DEPLOYMENT COMPLETE - Copy to .env.local:");
        console.log("=================================================\n");
        
        console.log("# LOCAL");
        console.log("NEXT_PUBLIC_CHAIN_ID=1337");
        console.log("NEXT_PUBLIC_CHAIN_NAME=Localhost 8545");
        console.log("");
        console.log("# Contract Addresses");
        console.log("NEXT_PUBLIC_PACK1155=%s", address(pack));
        console.log("NEXT_PUBLIC_BURN_GATEWAY=%s", address(gateway));
        console.log("NEXT_PUBLIC_FORTUNE721=%s", address(fortune));
        console.log("");
        console.log("# Mock NFT Check");
        console.log("NEXT_PUBLIC_PROMISE_CONTRACT=%s", address(mockNFT));
        console.log("NEXT_PUBLIC_PROMISE_TOKEN_ID=%s", tokenId);
        console.log("NEXT_PUBLIC_PROMISE_CHAIN_ID=1337");
        console.log("NEXT_PUBLIC_PROMISE_NFT=%s", address(mockNFT));
        console.log("");
        console.log("NEXT_PUBLIC_WALLETWITHPROMISE=%s", deployer);
        console.log("");
        console.log("# Pricing");
        console.log("NEXT_PUBLIC_PRICE_PER_PACK_WEI=30000000000000000");
        console.log("");
        console.log("# RPC");
        console.log("ALCHEMY_KEY=bgnYFwb8VMoYWaNsIvxFlUQSiZcwM6y9");
        console.log("INFURA_KEY=d6df61948f584c4385e4b73924d6b532");
        console.log("\n=================================================\n");
    }
}

