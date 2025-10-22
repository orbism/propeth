// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/Fortune721.sol";

contract Fortune721Test is Test {
    Fortune721 public fortune;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    string constant BASE_BG_CID = "QmBaseBgTestCID123";

    event FortuneMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256[3] cardIds,
        uint256[3] variants
    );

    function setUp() public {
        fortune = new Fortune721(BASE_BG_CID);

        // Set up sample fragment CIDs for testing
        _setupFragmentCIDs();
    }

    function _setupFragmentCIDs() internal {
        // Set texts for cards 0, 5, 10 (commonly used in tests)
        for (uint256 card = 0; card < 15; card += 5) {
            for (uint256 pos = 1; pos <= 3; pos++) {
                for (uint256 variant = 0; variant <= 1; variant++) {
                    string memory text = string(
                        abi.encodePacked(
                            "Card ",
                            vm.toString(card),
                            " pos ",
                            vm.toString(pos),
                            " variant ",
                            variant == 0 ? "A" : "B"
                        )
                    );
                    fortune.setFragmentText(card, pos, variant, text);
                }
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                        MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function testMintFromTriptych() public {
        uint256[3] memory cardIds = [uint256(0), 5, 10];

        vm.prank(user1);
        uint256 tokenId = fortune.mintFromTriptych(cardIds);

        assertEq(tokenId, 0, "First token should be ID 0");
        assertEq(fortune.ownerOf(tokenId), user1, "User should own token");
    }

    function testMintFromTriptychEmitsEvent() public {
        uint256[3] memory cardIds = [uint256(1), 7, 13];

        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit FortuneMinted(user1, 0, cardIds, [uint256(0), 0, 0]);
        fortune.mintFromTriptych(cardIds);
    }

    function testMintMultipleFortunes() public {
        uint256[3] memory cardIds1 = [uint256(0), 5, 10];
        uint256[3] memory cardIds2 = [uint256(2), 8, 14];

        vm.prank(user1);
        uint256 token1 = fortune.mintFromTriptych(cardIds1);

        vm.prank(user2);
        uint256 token2 = fortune.mintFromTriptych(cardIds2);

        assertEq(token1, 0);
        assertEq(token2, 1);
        assertEq(fortune.ownerOf(token1), user1);
        assertEq(fortune.ownerOf(token2), user2);
    }

    function testFortuneDataStored() public {
        uint256[3] memory cardIds = [uint256(3), 7, 12];

        vm.prank(user1);
        uint256 tokenId = fortune.mintFromTriptych(cardIds);

        (uint256 c1, uint256 c2, uint256 c3, uint256 v1, uint256 v2, uint256 v3) = fortune
            .fortuneData(tokenId);

        assertEq(c1, 3, "Card 1 should match");
        assertEq(c2, 7, "Card 2 should match");
        assertEq(c3, 12, "Card 3 should match");
        assertTrue(v1 <= 1, "Variant 1 should be 0 or 1");
        assertTrue(v2 <= 1, "Variant 2 should be 0 or 1");
        assertTrue(v3 <= 1, "Variant 3 should be 0 or 1");
    }

    /*//////////////////////////////////////////////////////////////
                        VALIDATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testRevertInvalidCardId() public {
        uint256[3] memory cardIds = [uint256(0), 5, 15]; // 15 is out of bounds

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Fortune721.InvalidCardId.selector, 15));
        fortune.mintFromTriptych(cardIds);
    }

    function testRevertDuplicateCards() public {
        uint256[3] memory cardIds = [uint256(5), 5, 10]; // Duplicate 5

        vm.prank(user1);
        vm.expectRevert(Fortune721.DuplicateCardsInTriptych.selector);
        fortune.mintFromTriptych(cardIds);
    }

    function testRevertDuplicateCards2() public {
        uint256[3] memory cardIds = [uint256(3), 7, 3]; // Duplicate 3

        vm.prank(user1);
        vm.expectRevert(Fortune721.DuplicateCardsInTriptych.selector);
        fortune.mintFromTriptych(cardIds);
    }

    /*//////////////////////////////////////////////////////////////
                        VARIANT GENERATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testVariantsDeterministic() public {
        uint256[3] memory cardIds = [uint256(0), 5, 10];

        // Mint in same block with same params should give same variants
        vm.prank(user1);
        uint256 token1 = fortune.mintFromTriptych(cardIds);

        (, , , uint256 v1_1, uint256 v2_1, uint256 v3_1) = fortune.fortuneData(token1);

        // Different user, different block should give different result
        vm.roll(block.number + 1);
        vm.prank(user2);
        uint256 token2 = fortune.mintFromTriptych(cardIds);

        (, , , uint256 v1_2, uint256 v2_2, uint256 v3_2) = fortune.fortuneData(token2);

        // At least one variant should differ (high probability)
        bool different = (v1_1 != v1_2) || (v2_1 != v2_2) || (v3_1 != v3_2);
        assertTrue(different, "Variants should differ across mints");
    }

    function testVariantsBinary() public {
        uint256[3] memory cardIds = [uint256(1), 6, 11];

        vm.prank(user1);
        uint256 tokenId = fortune.mintFromTriptych(cardIds);

        (, , , uint256 v1, uint256 v2, uint256 v3) = fortune.fortuneData(tokenId);

        assertTrue(v1 == 0 || v1 == 1, "Variant 1 must be 0 or 1");
        assertTrue(v2 == 0 || v2 == 1, "Variant 2 must be 0 or 1");
        assertTrue(v3 == 0 || v3 == 1, "Variant 3 must be 0 or 1");
    }

    /*//////////////////////////////////////////////////////////////
                        TOKEN URI TESTS
    //////////////////////////////////////////////////////////////*/

    function testTokenURIExists() public {
        uint256[3] memory cardIds = [uint256(0), 5, 10];

        vm.prank(user1);
        uint256 tokenId = fortune.mintFromTriptych(cardIds);

        string memory uri = fortune.tokenURI(tokenId);

        // Should start with data:application/json;base64,
        bytes memory uriBytes = bytes(uri);
        assertTrue(uriBytes.length > 0, "URI should not be empty");

        // Check for base64 prefix
        assertTrue(
            keccak256(bytes(substring(uri, 0, 29))) ==
                keccak256(bytes("data:application/json;base64,")),
            "Should have JSON base64 prefix"
        );
    }

    function testTokenURIContainsSVG() public {
        uint256[3] memory cardIds = [uint256(0), 5, 10];

        vm.prank(user1);
        uint256 tokenId = fortune.mintFromTriptych(cardIds);

        string memory uri = fortune.tokenURI(tokenId);

        // URI should contain references to SVG and IPFS
        assertTrue(contains(uri, "svg"), "Should contain SVG reference");
        assertTrue(contains(uri, "ipfs"), "Should contain IPFS reference");
    }

    function testTokenURINonexistent() public {
        vm.expectRevert();
        fortune.tokenURI(999);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetBaseBgCID() public {
        string memory newCID = "QmNewBaseBgCID456";
        fortune.setBaseBgCID(newCID);

        assertEq(fortune.baseBgCID(), newCID, "Base BG CID should be updated");
    }

    function testSetFontURI() public {
        string memory fontUri = "ipfs://QmFontFile123";
        fortune.setFontURI(fontUri);

        assertEq(fortune.fontURI(), fontUri, "Font URI should be updated");
    }

    function testSetFragmentCID() public {
        string memory newText = "This is a test text fragment";
        fortune.setFragmentText(5, 2, 1, newText);

        assertEq(
            fortune.fragmentTexts(5, 2, 1),
            newText,
            "Fragment text should be updated"
        );
    }

    function testSetFragmentCIDBatch() public {
        uint256[] memory cardIds = new uint256[](3);
        uint256[] memory positions = new uint256[](3);
        uint256[] memory variants = new uint256[](3);
        string[] memory texts = new string[](3);

        cardIds[0] = 0;
        cardIds[1] = 1;
        cardIds[2] = 2;
        positions[0] = 1;
        positions[1] = 2;
        positions[2] = 3;
        variants[0] = 0;
        variants[1] = 1;
        variants[2] = 0;
        texts[0] = "First text fragment";
        texts[1] = "Second text fragment";
        texts[2] = "Third text fragment";

        fortune.setFragmentTextBatch(cardIds, positions, variants, texts);

        assertEq(fortune.fragmentTexts(0, 1, 0), "First text fragment");
        assertEq(fortune.fragmentTexts(1, 2, 1), "Second text fragment");
        assertEq(fortune.fragmentTexts(2, 3, 0), "Third text fragment");
    }

    function testSetGlobalSalt() public {
        bytes32 newSalt = keccak256("new salt");
        fortune.setGlobalSalt(newSalt);

        assertEq(fortune.globalSalt(), newSalt, "Global salt should be updated");
    }

    function testSetRoyalty() public {
        address receiver = address(0x999);
        uint96 feeNumerator = 500; // 5%

        fortune.setRoyalty(receiver, feeNumerator);

        (address royaltyReceiver, uint256 royaltyAmount) = fortune.royaltyInfo(0, 10_000);
        assertEq(royaltyReceiver, receiver);
        assertEq(royaltyAmount, 500);
    }

    /*//////////////////////////////////////////////////////////////
                        ACCESS CONTROL TESTS
    //////////////////////////////////////////////////////////////*/

    function testOnlyOwnerCanSetBaseBgCID() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        fortune.setBaseBgCID("unauthorized");
    }

    function testOnlyOwnerCanSetFragmentCID() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        fortune.setFragmentText(0, 1, 0, "unauthorized");
    }

    function testOnlyOwnerCanSetGlobalSalt() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        fortune.setGlobalSalt(keccak256("unauthorized"));
    }

    /*//////////////////////////////////////////////////////////////
                        TOTAL SUPPLY TEST
    //////////////////////////////////////////////////////////////*/

    function testTotalSupply() public {
        assertEq(fortune.totalSupply(), 0, "Initial supply should be 0");

        uint256[3] memory cardIds1 = [uint256(0), 5, 10];
        uint256[3] memory cardIds2 = [uint256(1), 6, 11];

        vm.prank(user1);
        fortune.mintFromTriptych(cardIds1);

        assertEq(fortune.totalSupply(), 1, "Supply should be 1");

        vm.prank(user2);
        fortune.mintFromTriptych(cardIds2);

        assertEq(fortune.totalSupply(), 2, "Supply should be 2");
    }

    /*//////////////////////////////////////////////////////////////
                        INTERFACE SUPPORT TESTS
    //////////////////////////////////////////////////////////////*/

    function testSupportsInterface() public view {
        // ERC721
        assertTrue(fortune.supportsInterface(0x80ac58cd));
        // ERC2981
        assertTrue(fortune.supportsInterface(0x2a55205a));
    }

    /*//////////////////////////////////////////////////////////////
                        HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function substring(
        string memory str,
        uint256 startIndex,
        uint256 endIndex
    ) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function contains(string memory str, string memory searchStr) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory searchBytes = bytes(searchStr);

        if (searchBytes.length > strBytes.length) return false;

        for (uint256 i = 0; i <= strBytes.length - searchBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < searchBytes.length; j++) {
                if (strBytes[i + j] != searchBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }
}