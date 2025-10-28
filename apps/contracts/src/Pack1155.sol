// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IRandomness.sol";

/**
 * @title Pack1155
 * @notice ERC1155 NFT contract that mints packs of exactly 3 random cards
 * @dev Enforces PACK_SIZE=3, supply caps, and pluggable randomness
 */
contract Pack1155 is ERC1155, ERC2981, Ownable, Pausable, ReentrancyGuard {
    /// @notice Fixed pack size - always mints exactly 3 cards
    uint256 public constant PACK_SIZE = 3;

    /// @notice Maximum number of distinct card IDs available
    uint256 public maxCardId;

    /// @notice Price per pack in wei
    uint256 public pricePerPack;

    /// @notice Address to receive mint proceeds
    address public payoutAddress;

    /// @notice Pluggable randomness source
    IRandomness public randomnessSource;

    /// @notice Entropy epoch for randomness rotation
    uint256 public entropyEpoch;

    /// @notice BurnRedeemGateway address (can mint for free)
    address public gateway;

    /// @notice Maximum supply per card ID (0 = unlimited)
    mapping(uint256 => uint256) public maxSupply;

    /// @notice Total minted per card ID
    mapping(uint256 => uint256) public totalMinted;

    /// @notice Tracks if an address has minted a pack
    mapping(address => bool) public hasMintedPack;

    /// @notice Emitted when a pack is minted
    event PackMinted(address indexed to, uint256[3] ids, uint256 packIndex);

    /// @notice Emitted when price is updated
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);

    /// @notice Emitted when payout address is updated
    event PayoutAddressUpdated(address indexed oldAddress, address indexed newAddress);

    /// @notice Emitted when randomness source is updated
    event RandomnessSourceUpdated(address indexed newSource);

    /// @notice Emitted when max supply is set for an ID
    event MaxSupplySet(uint256 indexed id, uint256 maxSupply);

    error InsufficientPayment(uint256 required, uint256 provided);
    error SupplyExhausted(uint256 id);
    error InvalidCardId(uint256 id);
    error InvalidPayoutAddress();
    error InvalidRandomnessSource();
    error WithdrawalFailed();
    error OnlyGateway();
    error AlreadyMintedPack();

    /**
     * @notice Initializes the Pack1155 contract
     * @param _baseURI Base URI for token metadata
     * @param _maxCardId Maximum card ID (IDs are 0 to _maxCardId-1)
     * @param _pricePerPack Price per pack in wei
     * @param _payoutAddress Address to receive mint proceeds
     * @param _randomnessSource Initial randomness source
     */
    constructor(
        string memory _baseURI,
        uint256 _maxCardId,
        uint256 _pricePerPack,
        address _payoutAddress,
        address _randomnessSource
    ) ERC1155(_baseURI) Ownable(msg.sender) {
        if (_payoutAddress == address(0)) revert InvalidPayoutAddress();
        if (_randomnessSource == address(0)) revert InvalidRandomnessSource();

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
        
        return _mintPackInternal(to);
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
        // Check if address has already minted a pack
        if (hasMintedPack[to]) revert AlreadyMintedPack();

        // Generate entropy for this pack
        bytes32 entropy = keccak256(
            abi.encodePacked(
                msg.sender,
                to,
                block.timestamp,
                block.prevrandao,
                entropyEpoch,
                totalMinted[0] // Use first ID's mint count as additional entropy
            )
        );

        // Draw 3 random cards
        ids = _drawCards(entropy);

        // Mint cards
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1;
        amounts[1] = 1;
        amounts[2] = 1;

        // Convert fixed array to dynamic for _mintBatch
        uint256[] memory idsDynamic = new uint256[](3);
        idsDynamic[0] = ids[0];
        idsDynamic[1] = ids[1];
        idsDynamic[2] = ids[2];

        _mintBatch(to, idsDynamic, amounts, "");

        // Mark address as having minted a pack
        hasMintedPack[to] = true;

        emit PackMinted(to, ids, totalMinted[0] / PACK_SIZE);
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

            // Rejection sampling to avoid supply exhaustion and duplicates
            while (attempts < 100) {
                // Use randomness source with position-specific salt
                bytes32 salt = keccak256(abi.encodePacked(entropy, i, attempts));
                uint256 random = randomnessSource.draw(salt);
                id = random % maxCardId;

                // Check if ID is available
                if (maxSupply[id] == 0 || totalMinted[id] < maxSupply[id]) {
                    // Check for duplicates within this pack
                    isDuplicate = false;
                    for (uint256 j = 0; j < i; j++) {
                        if (ids[j] == id) {
                            isDuplicate = true;
                            break;
                        }
                    }
                    
                    // If no duplicate, we found a valid card
                    if (!isDuplicate) {
                        break;
                    }
                }

                attempts++;
            }

            // If all attempts exhausted, revert
            if (maxSupply[id] > 0 && totalMinted[id] >= maxSupply[id]) {
                revert SupplyExhausted(id);
            }

            ids[i] = id;
            totalMinted[id]++;
        }
    }

    /**
     * @notice Sets the base URI for token metadata
     * @param newURI New base URI
     */
    function setURI(string memory newURI) external onlyOwner {
        _setURI(newURI);
    }

    /**
     * @notice Sets maximum supply for a card ID
     * @param id Card ID
     * @param supply Maximum supply (0 = unlimited)
     */
    function setMaxSupply(uint256 id, uint256 supply) external onlyOwner {
        if (id >= maxCardId) revert InvalidCardId(id);
        maxSupply[id] = supply;
        emit MaxSupplySet(id, supply);
    }

    /**
     * @notice Sets maximum supply for multiple card IDs
     * @param ids Array of card IDs
     * @param supplies Array of maximum supplies
     */
    function setMaxSupplyBatch(uint256[] calldata ids, uint256[] calldata supplies) 
        external 
        onlyOwner 
    {
        require(ids.length == supplies.length, "Length mismatch");
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] >= maxCardId) revert InvalidCardId(ids[i]);
            maxSupply[ids[i]] = supplies[i];
            emit MaxSupplySet(ids[i], supplies[i]);
        }
    }

    /**
     * @notice Sets the price per pack
     * @param newPrice New price in wei
     */
    function setPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = pricePerPack;
        pricePerPack = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }

    /**
     * @notice Sets the payout address
     * @param newAddress New payout address
     */
    function setPayoutAddress(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert InvalidPayoutAddress();
        address oldAddress = payoutAddress;
        payoutAddress = newAddress;
        emit PayoutAddressUpdated(oldAddress, newAddress);
    }

    /**
     * @notice Sets the randomness source
     * @param newSource New randomness source
     */
    function setRandomnessSource(address newSource) external onlyOwner {
        if (newSource == address(0)) revert InvalidRandomnessSource();
        randomnessSource = IRandomness(newSource);
        emit RandomnessSourceUpdated(newSource);
    }

    /**
     * @notice Sets the gateway address that can mint for free
     * @param newGateway New gateway address
     */
    function setGateway(address newGateway) external onlyOwner {
        gateway = newGateway;
    }

    /**
     * @notice Rotates the entropy epoch
     */
    function rotateEntropyEpoch() external onlyOwner {
        entropyEpoch++;
    }

    /**
     * @notice Sets royalty info (ERC2981)
     * @param receiver Royalty receiver address
     * @param feeNumerator Royalty fee in basis points (e.g., 500 = 5%)
     */
    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @notice Pauses the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraws contract balance to payout address
     */
    function withdraw() external nonReentrant {
        uint256 balance = address(this).balance;
        (bool success, ) = payoutAddress.call{value: balance}("");
        if (!success) revert WithdrawalFailed();
    }

    /**
     * @notice Checks if contract supports an interface
     * @param interfaceId Interface ID to check
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}