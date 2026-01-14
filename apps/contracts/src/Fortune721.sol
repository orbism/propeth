// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Fortune721
 * @notice ERC721 fortune NFTs with on-chain SVG composition from triptych
 * @dev Composes 4 layers: base background + 3 card fragments (each with A/B variant)
 */
contract Fortune721 is ERC721, ERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;

    /// @notice Total number of distinct cards in the deck
    uint256 public constant MAX_CARDS = 15;

    /// @notice Next token ID to mint
    uint256 private _nextTokenId;

    /// @notice Global salt for deterministic randomness
    bytes32 public globalSalt;

    /// @notice Base background IPFS CID
    string public baseBgCID;

    /// @notice Optional font file IPFS CID (or URI)
    string public fontURI;

    /// @notice Mapping: cardId => position => variant => text string
    /// position: 1, 2, 3
    /// variant: 0 = A, 1 = B
    mapping(uint256 => mapping(uint256 => mapping(uint256 => string))) public fragmentTexts;

    /// @notice Mapping: tokenId => triptych composition (3 card IDs + 3 variants)
    struct FortuneData {
        uint256 card1;
        uint256 card2;
        uint256 card3;
        uint256 variant1; // 0 or 1
        uint256 variant2;
        uint256 variant3;
    }
    mapping(uint256 => FortuneData) public fortuneData;

    /// @notice Track last 3 card IDs minted by user (from Pack1155)
    mapping(address => uint256[3]) public lastThreeCardsMinted;

    /// @notice Track if fortune was created from the last three cards
    mapping(address => bool) public fortuneCreatedFromLastThree;

    /// @notice Pack1155 contract address (authorized to reset user state)
    address public pack1155;

    /// @notice Emitted when a fortune is minted
    event FortuneMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256[3] cardIds,
        uint256[3] variants
    );

    /// @notice Emitted when user state is reset for new mint pack
    event UserResetForNewMintPack(address indexed user);

    error InvalidCardId(uint256 cardId);
    error DuplicateCardsInTriptych();
    error OnlyPack1155();
    error InvalidPack1155();

    /**
     * @param _baseBgCID IPFS CID for base background PNG
     */
    constructor(string memory _baseBgCID) ERC721("Bezmiar Fortune", "FORTUNE") Ownable(msg.sender) {
        baseBgCID = _baseBgCID;
        fontURI = ""; // Optional, can be set later
        globalSalt = keccak256(abi.encodePacked(block.timestamp, msg.sender));
    }

    /**
     * @notice Mints a fortune NFT from a triptych of 3 cards
     * @param cardIds Array of 3 card IDs (must be distinct)
     * @return tokenId Minted token ID
     */
    function mintFromTriptych(uint256[3] calldata cardIds)
        external
        nonReentrant
        returns (uint256 tokenId)
    {
        // Validate card IDs
        for (uint256 i = 0; i < 3; i++) {
            if (cardIds[i] >= MAX_CARDS) revert InvalidCardId(cardIds[i]);
        }

        // Ensure no duplicates
        if (cardIds[0] == cardIds[1] || cardIds[0] == cardIds[2] || cardIds[1] == cardIds[2]) {
            revert DuplicateCardsInTriptych();
        }

        // Generate variants (0 or 1) for each position
        uint256[3] memory variants = _generateVariants(cardIds, msg.sender);

        // Mint token
        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        // Store fortune data
        fortuneData[tokenId] = FortuneData({
            card1: cardIds[0],
            card2: cardIds[1],
            card3: cardIds[2],
            variant1: variants[0],
            variant2: variants[1],
            variant3: variants[2]
        });

        // Update user's last three cards and fortune creation status
        lastThreeCardsMinted[msg.sender] = cardIds;
        fortuneCreatedFromLastThree[msg.sender] = true;

        emit FortuneMinted(msg.sender, tokenId, cardIds, variants);
    }

    /**
     * @notice Generates random variants (A or B) for each position
     * @param cardIds The 3 card IDs
     * @param minter Address of minter (for entropy)
     * @return variants Array of 3 variants (0 or 1)
     */
    function _generateVariants(uint256[3] calldata cardIds, address minter)
        internal
        view
        returns (uint256[3] memory variants)
    {
        bytes32 entropy = keccak256(
            abi.encodePacked(
                globalSalt,
                cardIds[0],
                cardIds[1],
                cardIds[2],
                minter,
                block.timestamp,
                block.prevrandao,
                _nextTokenId
            )
        );

        for (uint256 i = 0; i < 3; i++) {
            // Extract bit for each position
            variants[i] = (uint256(entropy) >> i) & 1;
        }
    }

    /**
     * @notice Returns token URI with on-chain text SVG composition
     * @param tokenId Token ID
     * @return Base64-encoded JSON with embedded SVG
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        FortuneData memory data = fortuneData[tokenId];

        // Get the three text fragments
        string memory text1 = fragmentTexts[data.card1][1][data.variant1];
        string memory text2 = fragmentTexts[data.card2][2][data.variant2];
        string memory text3 = fragmentTexts[data.card3][3][data.variant3];

        // Build SVG with background image + text overlays
        string memory fontDef = bytes(fontURI).length > 0
            ? string(abi.encodePacked('<defs><style>@font-face{font-family:"Custom";src:url(', fontURI, ');}</style></defs>'))
            : "";

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet">',
                fontDef,
                '<image href="https://propeth.4everland.link/ipfs/',
                baseBgCID,
                '" width="1920" height="1080"/>',
                '<text x="960" y="430" text-anchor="middle" fill="#000" font-size="48" font-family="',
                bytes(fontURI).length > 0 ? "Custom" : "monospace",
                '">',
                text1,
                '</text>',
                '<text x="960" y="580" text-anchor="middle" fill="#000" font-size="48" font-family="',
                bytes(fontURI).length > 0 ? "Custom" : "monospace",
                '">',
                text2,
                '</text>',
                '<text x="960" y="730" text-anchor="middle" fill="#000" font-size="48" font-family="',
                bytes(fontURI).length > 0 ? "Custom" : "monospace",
                '">',
                text3,
                '</text>',
                "</svg>"
            )
        );

        // Build JSON metadata
        string memory json = string(
            abi.encodePacked(
                '{"name":"Fortune #',
                tokenId.toString(),
                '","description":"A mystical fortune composed from the triptych of cards ',
                data.card1.toString(),
                ", ",
                data.card2.toString(),
                ", ",
                data.card3.toString(),
                '","image":"data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '","attributes":[',
                '{"trait_type":"Card 1","value":"',
                data.card1.toString(),
                '"},',
                '{"trait_type":"Card 2","value":"',
                data.card2.toString(),
                '"},',
                '{"trait_type":"Card 3","value":"',
                data.card3.toString(),
                '"},',
                '{"trait_type":"Variant 1","value":"',
                data.variant1 == 0 ? "A" : "B",
                '"},',
                '{"trait_type":"Variant 2","value":"',
                data.variant2 == 0 ? "A" : "B",
                '"},',
                '{"trait_type":"Variant 3","value":"',
                data.variant3 == 0 ? "A" : "B",
                '"}',
                "]}"
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    /**
     * @notice Sets base background CID
     * @param _cid IPFS CID for background PNG
     */
    function setBaseBgCID(string calldata _cid) external onlyOwner {
        baseBgCID = _cid;
    }

    /**
     * @notice Sets font URI (IPFS or other)
     * @param _uri Font file URI
     */
    function setFontURI(string calldata _uri) external onlyOwner {
        fontURI = _uri;
    }

    /**
     * @notice Sets fragment text for a specific card, position, and variant
     * @param cardId Card ID (0-14)
     * @param position Position (1, 2, or 3)
     * @param variant Variant (0=A, 1=B)
     * @param text Text string for this fragment
     */
    function setFragmentText(
        uint256 cardId,
        uint256 position,
        uint256 variant,
        string calldata text
    ) external onlyOwner {
        if (cardId >= MAX_CARDS) revert InvalidCardId(cardId);
        require(position >= 1 && position <= 3, "Invalid position");
        require(variant <= 1, "Invalid variant");

        fragmentTexts[cardId][position][variant] = text;
    }

    /**
     * @notice Batch sets fragment texts
     * @param cardIds Array of card IDs
     * @param positions Array of positions
     * @param variants Array of variants
     * @param texts Array of text strings
     */
    function setFragmentTextBatch(
        uint256[] calldata cardIds,
        uint256[] calldata positions,
        uint256[] calldata variants,
        string[] calldata texts
    ) external onlyOwner {
        require(
            cardIds.length == positions.length &&
            positions.length == variants.length &&
            variants.length == texts.length,
            "Length mismatch"
        );

        for (uint256 i = 0; i < cardIds.length; i++) {
            if (cardIds[i] >= MAX_CARDS) revert InvalidCardId(cardIds[i]);
            require(positions[i] >= 1 && positions[i] <= 3, "Invalid position");
            require(variants[i] <= 1, "Invalid variant");

            fragmentTexts[cardIds[i]][positions[i]][variants[i]] = texts[i];
        }
    }

    /**
     * @notice Sets global salt for randomness
     * @param _salt New salt
     */
    function setGlobalSalt(bytes32 _salt) external onlyOwner {
        globalSalt = _salt;
    }

    /**
     * @notice Sets royalty info (ERC2981)
     * @param receiver Royalty receiver
     * @param feeNumerator Fee in basis points
     */
    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @notice Sets the Pack1155 contract address (authorized to reset user state)
     * @param _pack1155 Address of Pack1155 contract
     */
    function setPack1155(address _pack1155) external onlyOwner {
        if (_pack1155 == address(0)) revert InvalidPack1155();
        pack1155 = _pack1155;
    }

    /**
     * @notice Resets user's fortune creation status (called when new pack is minted)
     * @dev Only callable by Pack1155 contract
     * @param user Address to reset
     */
    function resetUserState(address user) external {
        if (msg.sender != pack1155) revert OnlyPack1155();
        fortuneCreatedFromLastThree[user] = false;
        emit UserResetForNewMintPack(user);
    }

    /**
     * @notice Total supply of minted fortunes
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Checks interface support
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}