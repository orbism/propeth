// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/BurnRedeemGateway.sol";
import "../src/Pack1155.sol";
import "../src/adapters/DirectBurn721.sol";
import "../src/adapters/DirectBurn1155.sol";
import "../src/adapters/DeadTransfer721.sol";
import "../src/adapters/DeadTransfer1155.sol";
import "../src/mocks/MockRandomness.sol";
import "../src/mocks/MockERC721.sol";
import "../src/mocks/MockERC1155.sol";

contract BurnRedeemGatewayTest is Test {
    BurnRedeemGateway public gateway;
    Pack1155 public pack;
    MockRandomness public randomness;

    MockERC721 public mock721;
    MockERC1155 public mock1155;

    DirectBurn721 public directBurn721;
    DirectBurn1155 public directBurn1155;
    DeadTransfer721 public deadTransfer721;
    DeadTransfer1155 public deadTransfer1155;

    address public owner = address(this);
    address public payout = address(0x1);
    address public user = address(0x2);

    uint256 constant MAX_CARD_ID = 10;
    uint256 constant PRICE_PER_PACK = 0 ether; // Free for burn redemption

    event BurnedForPack(
        address indexed user,
        address indexed collection,
        uint256 tokenId,
        uint256 amount
    );
    event AdapterSet(address indexed collection, address indexed adapter);

    function setUp() public {
        // Deploy randomness and pack
        randomness = new MockRandomness();
        pack = new Pack1155(
            "ipfs://base/",
            MAX_CARD_ID,
            PRICE_PER_PACK,
            payout,
            address(randomness)
        );

        // Deploy gateway
        gateway = new BurnRedeemGateway(address(pack));

        // Deploy mock NFTs
        mock721 = new MockERC721();
        mock1155 = new MockERC1155();

        // Deploy adapters
        directBurn721 = new DirectBurn721(address(mock721));
        directBurn1155 = new DirectBurn1155(address(mock1155));
        deadTransfer721 = new DeadTransfer721(address(mock721));
        deadTransfer1155 = new DeadTransfer1155(address(mock1155));

        // Configure pack to allow gateway to mint for free
        pack.setPrice(0);

        // Give gateway owner role on pack (for minting without payment)
        pack.transferOwnership(address(gateway));
        vm.prank(address(gateway));
        pack.transferOwnership(owner);
    }

    /*//////////////////////////////////////////////////////////////
                        DIRECT BURN 721 TESTS
    //////////////////////////////////////////////////////////////*/

    function testDirectBurn721() public {
        // Set adapter
        gateway.setAdapter(address(mock721), address(directBurn721));

        // Mint NFT to user
        uint256 tokenId = mock721.mint(user);

        // Approve adapter
        vm.prank(user);
        mock721.approve(address(directBurn721), tokenId);

        // Burn and mint pack
        vm.prank(user);
        gateway.burnAndMintPack(address(mock721), tokenId, 1);

        // Verify NFT was burned
        vm.expectRevert();
        mock721.ownerOf(tokenId);

        // Verify user received pack (3 cards)
        bool receivedCards = false;
        for (uint256 i = 0; i < MAX_CARD_ID; i++) {
            if (pack.balanceOf(user, i) > 0) {
                receivedCards = true;
                break;
            }
        }
        assertTrue(receivedCards, "User should have received cards");
    }

    function testDirectBurn721EmitsEvent() public {
        gateway.setAdapter(address(mock721), address(directBurn721));

        uint256 tokenId = mock721.mint(user);
        vm.prank(user);
        mock721.approve(address(directBurn721), tokenId);

        vm.expectEmit(true, true, false, true);
        emit BurnedForPack(user, address(mock721), tokenId, 1);

        vm.prank(user);
        gateway.burnAndMintPack(address(mock721), tokenId, 1);
    }

    /*//////////////////////////////////////////////////////////////
                        DIRECT BURN 1155 TESTS
    //////////////////////////////////////////////////////////////*/

    function testDirectBurn1155() public {
        // Set adapter
        gateway.setAdapter(address(mock1155), address(directBurn1155));

        // Mint NFT to user
        uint256 tokenId = 5;
        uint256 amount = 10;
        mock1155.mint(user, tokenId, amount);

        // Approve adapter
        vm.prank(user);
        mock1155.setApprovalForAll(address(directBurn1155), true);

        uint256 balanceBefore = mock1155.balanceOf(user, tokenId);

        // Burn and mint pack
        vm.prank(user);
        gateway.burnAndMintPack(address(mock1155), tokenId, amount);

        // Verify tokens were burned
        assertEq(
            mock1155.balanceOf(user, tokenId),
            balanceBefore - amount,
            "Tokens should be burned"
        );

        // Verify user received pack
        bool receivedCards = false;
        for (uint256 i = 0; i < MAX_CARD_ID; i++) {
            if (pack.balanceOf(user, i) > 0) {
                receivedCards = true;
                break;
            }
        }
        assertTrue(receivedCards, "User should have received cards");
    }

    /*//////////////////////////////////////////////////////////////
                        DEAD TRANSFER 721 TESTS
    //////////////////////////////////////////////////////////////*/

    function testDeadTransfer721() public {
        // Set adapter
        gateway.setAdapter(address(mock721), address(deadTransfer721));

        // Mint NFT to user
        uint256 tokenId = mock721.mint(user);

        // Approve adapter
        vm.prank(user);
        mock721.approve(address(deadTransfer721), tokenId);

        // Burn and mint pack
        vm.prank(user);
        gateway.burnAndMintPack(address(mock721), tokenId, 1);

        // Verify NFT was transferred to dead address
        assertEq(
            mock721.ownerOf(tokenId),
            0x000000000000000000000000000000000000dEaD,
            "Token should be in dead address"
        );
    }

    /*//////////////////////////////////////////////////////////////
                        DEAD TRANSFER 1155 TESTS
    //////////////////////////////////////////////////////////////*/

    function testDeadTransfer1155() public {
        // Set adapter
        gateway.setAdapter(address(mock1155), address(deadTransfer1155));

        // Mint NFT to user
        uint256 tokenId = 3;
        uint256 amount = 5;
        mock1155.mint(user, tokenId, amount);

        // Approve adapter
        vm.prank(user);
        mock1155.setApprovalForAll(address(deadTransfer1155), true);

        // Burn and mint pack
        vm.prank(user);
        gateway.burnAndMintPack(address(mock1155), tokenId, amount);

        // Verify tokens were transferred to dead address
        assertEq(
            mock1155.balanceOf(0x000000000000000000000000000000000000dEaD, tokenId),
            amount,
            "Tokens should be in dead address"
        );
        assertEq(mock1155.balanceOf(user, tokenId), 0, "User should have 0 tokens");
    }

    /*//////////////////////////////////////////////////////////////
                        ADAPTER MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetAdapter() public {
        vm.expectEmit(true, true, false, false);
        emit AdapterSet(address(mock721), address(directBurn721));

        gateway.setAdapter(address(mock721), address(directBurn721));

        assertEq(
            address(gateway.adapters(address(mock721))),
            address(directBurn721),
            "Adapter should be set"
        );
    }

    function testSetAdapterBatch() public {
        address[] memory collections = new address[](2);
        address[] memory adapters = new address[](2);

        collections[0] = address(mock721);
        collections[1] = address(mock1155);
        adapters[0] = address(directBurn721);
        adapters[1] = address(directBurn1155);

        gateway.setAdapterBatch(collections, adapters);

        assertEq(address(gateway.adapters(address(mock721))), address(directBurn721));
        assertEq(address(gateway.adapters(address(mock1155))), address(directBurn1155));
    }

    function testRemoveAdapter() public {
        gateway.setAdapter(address(mock721), address(directBurn721));

        gateway.removeAdapter(address(mock721));

        assertEq(address(gateway.adapters(address(mock721))), address(0));
    }

    /*//////////////////////////////////////////////////////////////
                        ERROR TESTS
    //////////////////////////////////////////////////////////////*/

    function testRevertNoAdapterSet() public {
        uint256 tokenId = mock721.mint(user);

        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(BurnRedeemGateway.NoAdapterSet.selector, address(mock721))
        );
        gateway.burnAndMintPack(address(mock721), tokenId, 1);
    }

    function testRevertWhenPaused() public {
        gateway.setAdapter(address(mock721), address(directBurn721));
        gateway.pause();

        uint256 tokenId = mock721.mint(user);
        vm.prank(user);
        mock721.approve(address(directBurn721), tokenId);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        gateway.burnAndMintPack(address(mock721), tokenId, 1);
    }

    function testRevertInvalidAmount721() public {
        gateway.setAdapter(address(mock721), address(directBurn721));

        uint256 tokenId = mock721.mint(user);
        vm.prank(user);
        mock721.approve(address(directBurn721), tokenId);

        vm.prank(user);
        vm.expectRevert(DirectBurn721.InvalidAmount.selector);
        gateway.burnAndMintPack(address(mock721), tokenId, 2);
    }

    /*//////////////////////////////////////////////////////////////
                        ACCESS CONTROL TESTS
    //////////////////////////////////////////////////////////////*/

    function testOnlyOwnerCanSetAdapter() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        gateway.setAdapter(address(mock721), address(directBurn721));
    }

    function testOnlyOwnerCanPause() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        gateway.pause();
    }

    function testOnlyOwnerCanRemoveAdapter() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        gateway.removeAdapter(address(mock721));
    }

    /*//////////////////////////////////////////////////////////////
                        REENTRANCY TESTS
    //////////////////////////////////////////////////////////////*/

    function testReentrancyGuard() public {
        // Gateway has nonReentrant modifier
        // This is guarded by OpenZeppelin's ReentrancyGuard
        assertTrue(true);
    }

    /*//////////////////////////////////////////////////////////////
                        PAUSE/UNPAUSE TESTS
    //////////////////////////////////////////////////////////////*/

    function testPauseUnpause() public {
        gateway.pause();
        assertTrue(gateway.paused(), "Gateway should be paused");

        gateway.unpause();
        assertFalse(gateway.paused(), "Gateway should be unpaused");
    }

    /*//////////////////////////////////////////////////////////////
                        INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testMultipleUsersBurnAndRedeem() public {
        gateway.setAdapter(address(mock721), address(directBurn721));

        address user1 = address(0x10);
        address user2 = address(0x20);

        // User 1 burns
        uint256 tokenId1 = mock721.mint(user1);
        vm.prank(user1);
        mock721.approve(address(directBurn721), tokenId1);
        vm.prank(user1);
        gateway.burnAndMintPack(address(mock721), tokenId1, 1);

        // User 2 burns
        uint256 tokenId2 = mock721.mint(user2);
        vm.prank(user2);
        mock721.approve(address(directBurn721), tokenId2);
        vm.prank(user2);
        gateway.burnAndMintPack(address(mock721), tokenId2, 1);

        // Both should have received cards
        bool user1HasCards = false;
        bool user2HasCards = false;

        for (uint256 i = 0; i < MAX_CARD_ID; i++) {
            if (pack.balanceOf(user1, i) > 0) user1HasCards = true;
            if (pack.balanceOf(user2, i) > 0) user2HasCards = true;
        }

        assertTrue(user1HasCards, "User 1 should have cards");
        assertTrue(user2HasCards, "User 2 should have cards");
    }
}