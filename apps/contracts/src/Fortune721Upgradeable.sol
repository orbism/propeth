// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin-upgradeable/contracts/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin-upgradeable/contracts/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Fortune721Upgradeable
 * @notice UUPS Upgradeable version of ERC721 fortune NFTs with on-chain SVG composition
 */
contract Fortune721Upgradeable is 
    Initializable,
    ERC721Upgradeable, 
    ERC2981Upgradeable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using Strings for uint256;

    uint256 public constant MAX_CARDS = 15;
    uint256 private _nextTokenId;
    bytes32 public globalSalt;
    string public baseBgCID;
    string public fontURI;

    mapping(uint256 => mapping(uint256 => mapping(uint256 => string))) public fragmentTexts;

    struct FortuneData {
        uint256 card1;
        uint256 card2;
        uint256 card3;
        uint256 variant1;
        uint256 variant2;
        uint256 variant3;
    }
    mapping(uint256 => FortuneData) public fortuneData;

    event FortuneMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256[3] cardIds,
        uint256[3] variants
    );

    error InvalidCardId(uint256 cardId);
    error DuplicateCardsInTriptych();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _baseBgCID) public initializer {
        __ERC721_init("Bezmiar Fortune", "FORTUNE");
        __ERC2981_init();
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        baseBgCID = _baseBgCID;
        fontURI = "";
        globalSalt = keccak256(abi.encodePacked(block.timestamp, msg.sender));
    }

    function mintFromTriptych(uint256[3] calldata cardIds)
        external
        nonReentrant
        returns (uint256 tokenId)
    {
        for (uint256 i = 0; i < 3; i++) {
            if (cardIds[i] >= MAX_CARDS) revert InvalidCardId(cardIds[i]);
        }

        if (cardIds[0] == cardIds[1] || cardIds[0] == cardIds[2] || cardIds[1] == cardIds[2]) {
            revert DuplicateCardsInTriptych();
        }

        uint256[3] memory variants = _generateVariants(cardIds, msg.sender);

        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        fortuneData[tokenId] = FortuneData({
            card1: cardIds[0],
            card2: cardIds[1],
            card3: cardIds[2],
            variant1: variants[0],
            variant2: variants[1],
            variant3: variants[2]
        });

        emit FortuneMinted(msg.sender, tokenId, cardIds, variants);
    }

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
            variants[i] = (uint256(entropy) >> i) & 1;
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        FortuneData memory data = fortuneData[tokenId];

        string memory text1 = fragmentTexts[data.card1][1][data.variant1];
        string memory text2 = fragmentTexts[data.card2][2][data.variant2];
        string memory text3 = fragmentTexts[data.card3][3][data.variant3];

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

    function setBaseBgCID(string calldata _cid) external onlyOwner {
        baseBgCID = _cid;
    }

    function setFontURI(string calldata _uri) external onlyOwner {
        fontURI = _uri;
    }

    function setFragmentText(uint256 cardId, uint256 position, uint256 variant, string calldata text) 
        external onlyOwner 
    {
        if (cardId >= MAX_CARDS) revert InvalidCardId(cardId);
        require(position >= 1 && position <= 3, "Invalid position");
        require(variant <= 1, "Invalid variant");
        fragmentTexts[cardId][position][variant] = text;
    }

    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC2981Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
