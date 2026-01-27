// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin-upgradeable/contracts/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin-upgradeable/contracts/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/utils/PausableUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";

interface IPack1155 {
    function getLastThreeCardsMinted(address user) external view returns (uint256[3] memory);
    function hasMintedPack(address user) external view returns (bool);
}

/**
 * @title Fortune721Upgradeable
 * @notice UUPS Upgradeable ERC721 fortune NFTs with on-chain SVG composition
 * @dev Composes fortunes from a triptych of 3 cards with A/B text variants
 */
contract Fortune721Upgradeable is
    Initializable,
    ERC721Upgradeable,
    ERC2981Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using Strings for uint256;

    uint256 public constant MAX_CARDS = 15;
    uint256 private _nextTokenId;
    bytes32 public globalSalt;
    string public baseBgCID;
    string public fontURI;
    address public payoutAddress;
    address public admin;
    address public pack1155;

    /// @notice Mapping: cardId => position => variant => text string
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

    /// @notice Track last 3 card IDs used for fortune by user
    mapping(address => uint256[3]) public lastThreeCardsMinted;

    /// @notice Track if fortune was created from the last three cards
    mapping(address => bool) public fortuneCreatedFromLastThree;

    event FortuneMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256[3] cardIds,
        uint256[3] variants
    );
    event PayoutAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event GlobalSaltRotated(bytes32 newSalt);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event Pack1155Updated(address indexed newPack1155);
    event UserResetForNewMintPack(address indexed user);

    error InvalidCardId(uint256 cardId);
    error DuplicateCardsInTriptych();
    error InvalidPayoutAddress();
    error WithdrawalFailed();
    error OnlyOwnerOrAdmin();
    error OnlyPack1155();
    error InvalidPack1155();
    error Pack1155NotSet();
    error UserHasNotMintedPack();
    error CardNotFromLastPack(uint256 cardId);

    modifier onlyOwnerOrAdmin() {
        if (msg.sender != owner() && msg.sender != admin) revert OnlyOwnerOrAdmin();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _baseBgCID) public initializer {
        __ERC721_init("Bezmiar Fortune", "FORTUNE");
        __ERC2981_init();
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        baseBgCID = _baseBgCID;
        fontURI = "";
        globalSalt = keccak256(abi.encodePacked(block.timestamp, msg.sender));
        payoutAddress = msg.sender;
    }

    /**
     * @notice Mints a fortune NFT from a triptych of 3 cards
     * @param cardIds Array of 3 card IDs (must be distinct and match user's last minted pack)
     * @return tokenId Minted token ID
     */
    function mintFromTriptych(uint256[3] calldata cardIds)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 tokenId)
    {
        // Validate card IDs are within range
        for (uint256 i = 0; i < 3; i++) {
            if (cardIds[i] >= MAX_CARDS) revert InvalidCardId(cardIds[i]);
        }

        // Validate no duplicates
        if (cardIds[0] == cardIds[1] || cardIds[0] == cardIds[2] || cardIds[1] == cardIds[2]) {
            revert DuplicateCardsInTriptych();
        }

        // Validate cards match user's last minted pack from Pack1155
        if (pack1155 == address(0)) revert Pack1155NotSet();

        // Check user has minted a pack
        if (!IPack1155(pack1155).hasMintedPack(msg.sender)) revert UserHasNotMintedPack();

        // Get the cards they were actually minted
        uint256[3] memory expectedCards = IPack1155(pack1155).getLastThreeCardsMinted(msg.sender);

        // Validate all provided cards match expected (order-independent)
        bool[3] memory matched;
        for (uint256 i = 0; i < 3; i++) {
            bool found = false;
            for (uint256 j = 0; j < 3; j++) {
                if (!matched[j] && cardIds[i] == expectedCards[j]) {
                    matched[j] = true;
                    found = true;
                    break;
                }
            }
            if (!found) revert CardNotFromLastPack(cardIds[i]);
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

        // Update user's last three cards and fortune creation status
        lastThreeCardsMinted[msg.sender] = cardIds;
        fortuneCreatedFromLastThree[msg.sender] = true;

        emit FortuneMinted(msg.sender, tokenId, cardIds, variants);
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

    // ============ Admin Functions ============

    function setBaseBgCID(string calldata _cid) external onlyOwnerOrAdmin {
        baseBgCID = _cid;
    }

    function setFontURI(string calldata _uri) external onlyOwnerOrAdmin {
        fontURI = _uri;
    }

    function setFragmentText(uint256 cardId, uint256 position, uint256 variant, string calldata text)
        external onlyOwnerOrAdmin
    {
        if (cardId >= MAX_CARDS) revert InvalidCardId(cardId);
        require(position >= 1 && position <= 3, "Invalid position");
        require(variant <= 1, "Invalid variant");
        fragmentTexts[cardId][position][variant] = text;
    }

    function setFragmentTextBatch(
        uint256[] calldata cardIds,
        uint256[] calldata positions,
        uint256[] calldata variants,
        string[] calldata texts
    ) external onlyOwnerOrAdmin {
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

    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwnerOrAdmin {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setAdmin(address newAdmin) external onlyOwner {
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminUpdated(oldAdmin, newAdmin);
    }

    function setPack1155(address _pack1155) external onlyOwner {
        if (_pack1155 == address(0)) revert InvalidPack1155();
        pack1155 = _pack1155;
        emit Pack1155Updated(_pack1155);
    }

    function setPayoutAddress(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert InvalidPayoutAddress();
        address oldAddress = payoutAddress;
        payoutAddress = newAddress;
        emit PayoutAddressUpdated(oldAddress, newAddress);
    }

    function setGlobalSalt(bytes32 newSalt) external onlyOwnerOrAdmin {
        globalSalt = newSalt;
        emit GlobalSaltRotated(newSalt);
    }

    function rotateGlobalSalt() external onlyOwnerOrAdmin {
        globalSalt = keccak256(abi.encodePacked(globalSalt, block.timestamp, block.prevrandao));
        emit GlobalSaltRotated(globalSalt);
    }

    function pause() external onlyOwnerOrAdmin {
        _pause();
    }

    function unpause() external onlyOwnerOrAdmin {
        _unpause();
    }

    function withdraw() external nonReentrant onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payoutAddress.call{value: balance}("");
        if (!success) revert WithdrawalFailed();
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
