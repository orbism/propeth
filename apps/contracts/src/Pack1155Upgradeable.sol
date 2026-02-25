// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin-upgradeable/contracts/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin-upgradeable/contracts/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/utils/PausableUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IRandomness.sol";

interface IFortune721 {
    function fortuneCreatedFromLastThree(address user) external view returns (bool);
    function resetUserState(address user) external;
}

/**
 * @title Pack1155Upgradeable
 * @notice UUPS Upgradeable ERC1155 contract for minting card packs
 * @dev Mints packs of exactly 3 random cards with pluggable randomness
 */
contract Pack1155Upgradeable is
    Initializable,
    ERC1155Upgradeable,
    ERC2981Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    uint256 public constant PACK_SIZE = 3;
    uint256 public maxCardId;
    uint256 public pricePerPack;
    address public payoutAddress;
    IRandomness public randomnessSource;
    uint256 public entropyEpoch;
    address public gateway;
    address public admin;
    address public fortune721;

    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public totalMinted;
    mapping(address => bool) public hasMintedPack;
    mapping(address => uint256[3]) public lastThreeCardsMinted;

    event PackMinted(address indexed to, uint256[3] ids, uint256 packIndex);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PayoutAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event RandomnessSourceUpdated(address indexed newSource);
    event MaxSupplySet(uint256 indexed id, uint256 maxSupply);
    event GatewayUpdated(address indexed newGateway);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event Fortune721Updated(address indexed newFortune721);

    error InsufficientPayment(uint256 required, uint256 provided);
    error SupplyExhausted(uint256 id);
    error InvalidCardId(uint256 id);
    error InvalidPayoutAddress();
    error InvalidRandomnessSource();
    error InvalidGateway();
    error InvalidFortune721();
    error WithdrawalFailed();
    error OnlyGateway();
    error AlreadyMintedPack();
    error OnlyOwnerOrAdmin();
    error DuplicateCardsFailed();

    modifier onlyOwnerOrAdmin() {
        if (msg.sender != owner() && msg.sender != admin) revert OnlyOwnerOrAdmin();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _baseURI,
        uint256 _maxCardId,
        uint256 _pricePerPack,
        address _payoutAddress,
        address _randomnessSource
    ) public initializer {
        if (_payoutAddress == address(0)) revert InvalidPayoutAddress();
        if (_randomnessSource == address(0)) revert InvalidRandomnessSource();

        __ERC1155_init(_baseURI);
        __ERC2981_init();
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        maxCardId = _maxCardId;
        pricePerPack = _pricePerPack;
        payoutAddress = _payoutAddress;
        randomnessSource = IRandomness(_randomnessSource);
    }

    /**
     * @notice Mints exactly 3 random cards to the recipient (requires payment)
     * @param to Recipient address
     * @return ids Array of 3 minted card IDs
     */
    function mintPack(address to)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256[3] memory ids)
    {
        if (msg.value < pricePerPack) {
            revert InsufficientPayment(pricePerPack, msg.value);
        }

        // Check if already minted, allow reset if fortune was created
        if (hasMintedPack[to]) {
            if (fortune721 != address(0)) {
                bool fortuneCreated = _checkFortuneCreated(to);
                if (!fortuneCreated) {
                    revert AlreadyMintedPack();
                }
                // Reset to allow new mint
                hasMintedPack[to] = false;
            } else {
                revert AlreadyMintedPack();
            }
        }

        return _mintPackInternal(to);
    }

    /**
     * @notice Mints exactly 3 random cards for free (only callable by gateway)
     * @param to Recipient address
     * @return ids Array of 3 minted card IDs
     */
    function mintPackFree(address to)
        external
        nonReentrant
        whenNotPaused
        returns (uint256[3] memory ids)
    {
        if (msg.sender != gateway) revert OnlyGateway();
        // For burn/redeem, always allow minting (gateway can override the once-per-user limit)
        hasMintedPack[to] = false;
        return _mintPackInternal(to);
    }

    /**
     * @notice User calls this to reset and mint a new pack after fortune creation
     * @dev Only callable by user who has created a fortune from their last pack
     */
    function resetAndMintNewPack() external payable nonReentrant whenNotPaused returns (uint256[3] memory ids) {
        if (msg.value < pricePerPack) {
            revert InsufficientPayment(pricePerPack, msg.value);
        }

        address user = msg.sender;

        // Check if they previously minted a pack
        if (!hasMintedPack[user]) {
            revert AlreadyMintedPack(); // Reuse error: they haven't minted before
        }

        // Check if fortune was created (via external call to Fortune721)
        bool fortuneCreated = false;
        if (fortune721 != address(0)) {
            fortuneCreated = _checkFortuneCreated(user);
        }

        // Only allow reset if fortune was created
        if (!fortuneCreated) {
            revert AlreadyMintedPack(); // Not allowed to re-mint without fortune
        }

        // Reset their state BEFORE minting new pack
        hasMintedPack[user] = false;

        // Now mint the new pack (will set hasMintedPack[user] = true again)
        return _mintPackInternal(user);
    }

    /**
     * @notice Internal function to mint a pack
     * @param to Recipient address
     * @return ids Array of 3 minted card IDs
     */
    function _mintPackInternal(address to)
        internal
        returns (uint256[3] memory ids)
    {
        if (hasMintedPack[to]) revert AlreadyMintedPack();

        bytes32 entropy = keccak256(
            abi.encodePacked(msg.sender, to, block.timestamp, block.prevrandao, entropyEpoch, totalMinted[0])
        );

        ids = _drawCards(entropy);

        uint256[] memory idsDynamic = new uint256[](3);
        uint256[] memory amounts = new uint256[](3);
        idsDynamic[0] = ids[0];
        idsDynamic[1] = ids[1];
        idsDynamic[2] = ids[2];
        amounts[0] = 1;
        amounts[1] = 1;
        amounts[2] = 1;

        _mintBatch(to, idsDynamic, amounts, "");

        // Record the last 3 cards minted by this user
        lastThreeCardsMinted[to] = ids;

        // Reset fortune flag - new cards haven't had a fortune created yet
        if (fortune721 != address(0)) {
            try IFortune721(fortune721).resetUserState(to) {} catch {}
        }

        hasMintedPack[to] = true;

        emit PackMinted(to, ids, totalMinted[0] / PACK_SIZE);
    }

    /**
     * @notice Checks if fortune was created for a user
     * @param user User address to check
     * @return True if fortune was created from last three cards
     */
    function _checkFortuneCreated(address user) internal view returns (bool) {
        if (fortune721 == address(0)) return false;

        try IFortune721(fortune721).fortuneCreatedFromLastThree(user) returns (bool created) {
            return created;
        } catch {
            return false;
        }
    }

    /**
     * @notice Draws 3 random card IDs with rejection sampling
     * @param entropy Entropy seed for randomness
     * @return ids Array of 3 card IDs
     */
    function _drawCards(bytes32 entropy) internal returns (uint256[3] memory ids) {
        for (uint256 i = 0; i < PACK_SIZE; i++) {
            uint256 attempts = 0;
            uint256 id;
            bool isDuplicate;

            while (attempts < 100) {
                bytes32 salt = keccak256(abi.encodePacked(entropy, i, attempts));
                uint256 random = randomnessSource.draw(salt);
                id = random % maxCardId;

                if (maxSupply[id] == 0 || totalMinted[id] < maxSupply[id]) {
                    isDuplicate = false;
                    for (uint256 j = 0; j < i; j++) {
                        if (ids[j] == id) {
                            isDuplicate = true;
                            break;
                        }
                    }
                    if (!isDuplicate) break;
                }
                attempts++;
            }

            if (maxSupply[id] > 0 && totalMinted[id] >= maxSupply[id]) {
                revert SupplyExhausted(id);
            }
            if (isDuplicate) {
                revert DuplicateCardsFailed();
            }

            ids[i] = id;
            totalMinted[id]++;
        }
    }

    /**
     * @notice Gets the last 3 cards minted for a user
     * @param user User address
     * @return Array of 3 card IDs
     */
    function getLastThreeCardsMinted(address user) external view returns (uint256[3] memory) {
        return lastThreeCardsMinted[user];
    }

    // ============ Admin Functions ============

    function setURI(string memory newURI) external onlyOwnerOrAdmin {
        _setURI(newURI);
    }

    function uri(uint256 id) public view override returns (string memory) {
        return string.concat(super.uri(id), Strings.toString(id), ".json");
    }

    function setMaxSupply(uint256 id, uint256 supply) external onlyOwnerOrAdmin {
        if (id >= maxCardId) revert InvalidCardId(id);
        maxSupply[id] = supply;
        emit MaxSupplySet(id, supply);
    }

    function setMaxSupplyBatch(uint256[] calldata ids, uint256[] calldata supplies) external onlyOwnerOrAdmin {
        require(ids.length == supplies.length, "Length mismatch");
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] >= maxCardId) revert InvalidCardId(ids[i]);
            maxSupply[ids[i]] = supplies[i];
            emit MaxSupplySet(ids[i], supplies[i]);
        }
    }

    function setPrice(uint256 newPrice) external onlyOwnerOrAdmin {
        uint256 oldPrice = pricePerPack;
        pricePerPack = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }

    function setPayoutAddress(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert InvalidPayoutAddress();
        address oldAddress = payoutAddress;
        payoutAddress = newAddress;
        emit PayoutAddressUpdated(oldAddress, newAddress);
    }

    function setRandomnessSource(address newSource) external onlyOwnerOrAdmin {
        if (newSource == address(0)) revert InvalidRandomnessSource();
        randomnessSource = IRandomness(newSource);
        emit RandomnessSourceUpdated(newSource);
    }

    function setGateway(address newGateway) external onlyOwner {
        if (newGateway == address(0)) revert InvalidGateway();
        gateway = newGateway;
        emit GatewayUpdated(newGateway);
    }

    function setFortune721(address newFortune721) external onlyOwner {
        if (newFortune721 == address(0)) revert InvalidFortune721();
        fortune721 = newFortune721;
        emit Fortune721Updated(newFortune721);
    }

    function setAdmin(address newAdmin) external onlyOwner {
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminUpdated(oldAdmin, newAdmin);
    }

    function rotateEntropyEpoch() external onlyOwnerOrAdmin {
        entropyEpoch++;
    }

    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwnerOrAdmin {
        _setDefaultRoyalty(receiver, feeNumerator);
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

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, ERC2981Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
