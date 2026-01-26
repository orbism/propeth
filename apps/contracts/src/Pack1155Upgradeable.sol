// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin-upgradeable/contracts/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin-upgradeable/contracts/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/utils/PausableUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IRandomness.sol";

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

    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public totalMinted;
    mapping(address => bool) public hasMintedPack;

    event PackMinted(address indexed to, uint256[3] ids, uint256 packIndex);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PayoutAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event RandomnessSourceUpdated(address indexed newSource);
    event MaxSupplySet(uint256 indexed id, uint256 maxSupply);
    event GatewayUpdated(address indexed newGateway);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);

    error InsufficientPayment(uint256 required, uint256 provided);
    error SupplyExhausted(uint256 id);
    error InvalidCardId(uint256 id);
    error InvalidPayoutAddress();
    error InvalidRandomnessSource();
    error InvalidGateway();
    error WithdrawalFailed();
    error OnlyGateway();
    error AlreadyMintedPack();
    error OnlyOwnerOrAdmin();

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
        return _mintPackInternal(to);
    }

    function mintPackFree(address to) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256[3] memory ids) 
    {
        if (msg.sender != gateway) revert OnlyGateway();
        return _mintPackInternal(to);
    }

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
        hasMintedPack[to] = true;

        emit PackMinted(to, ids, totalMinted[0] / PACK_SIZE);
    }

    function _drawCards(bytes32 entropy) internal returns (uint256[3] memory ids) {
        for (uint256 i = 0; i < PACK_SIZE; i++) {
            uint256 attempts = 0;
            uint256 id;

            while (attempts < 100) {
                bytes32 salt = keccak256(abi.encodePacked(entropy, i, attempts));
                uint256 random = randomnessSource.draw(salt);
                id = random % maxCardId;

                if (maxSupply[id] == 0 || totalMinted[id] < maxSupply[id]) {
                    bool isDuplicate = false;
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

            ids[i] = id;
            totalMinted[id]++;
        }
    }

    function setURI(string memory newURI) external onlyOwnerOrAdmin {
        _setURI(newURI);
    }

    function setMaxSupply(uint256 id, uint256 supply) external onlyOwnerOrAdmin {
        if (id >= maxCardId) revert InvalidCardId(id);
        maxSupply[id] = supply;
        emit MaxSupplySet(id, supply);
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
