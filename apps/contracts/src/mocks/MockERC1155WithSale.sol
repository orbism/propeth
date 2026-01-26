// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MockERC1155WithSale
 * @notice Mock ERC1155 mimicking Manifold's interface for testing
 * @dev Uses Manifold's burn signature: burn(address, uint256[], uint256[])
 */
contract MockERC1155WithSale is ERC1155, Ownable, ReentrancyGuard {
    /// @notice Token ID for the "Promise" token
    uint256 public constant PROMISE_TOKEN_ID = 1;

    /// @notice Max supply per token ID
    uint256 public constant MAX_SUPPLY = 200;

    /// @notice Initial mint amount
    uint256 public constant INITIAL_MINT = 50;

    /// @notice Track total minted per token ID
    mapping(uint256 => uint256) public totalMinted;

    /// @notice Sale price in wei
    uint256 public salePrice;

    /// @notice Whether sale is active
    bool public saleActive;

    /// @notice Address that received initial mint
    address public occvltAddress;

    event SalePriceUpdated(uint256 newPrice);
    event SaleStatusUpdated(bool active);

    /**
     * @notice Initializes contract and mints initial tokens to occvlt address
     * @param _occvlt Address to receive initial tokens
     */
    constructor(address _occvlt) ERC1155("ipfs://mock-promise/") Ownable(msg.sender) {
        require(_occvlt != address(0), "Invalid occvlt address");
        occvltAddress = _occvlt;

        // Mint initial supply to occvlt (each gets 1 token of PROMISE_TOKEN_ID)
        _mint(_occvlt, PROMISE_TOKEN_ID, INITIAL_MINT, "");
        totalMinted[PROMISE_TOKEN_ID] = INITIAL_MINT;

        salePrice = 0;
        saleActive = false;
    }

    /**
     * @notice Owner sets sale price
     * @param newPrice Price in wei
     */
    function setSalePrice(uint256 newPrice) external onlyOwner {
        salePrice = newPrice;
        emit SalePriceUpdated(newPrice);
    }

    /**
     * @notice Owner activates/deactivates sale
     * @param active Whether sale is active
     */
    function setSaleActive(bool active) external onlyOwner {
        saleActive = active;
        emit SaleStatusUpdated(active);
    }

    /**
     * @notice Public purchase function - mints 1 token to buyer
     */
    function purchase() external payable nonReentrant {
        require(saleActive, "Sale not active");
        require(totalMinted[PROMISE_TOKEN_ID] < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= salePrice, "Insufficient payment");

        _mint(msg.sender, PROMISE_TOKEN_ID, 1, "");
        totalMinted[PROMISE_TOKEN_ID]++;
    }

    /**
     * @notice Owner can mint to any address
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function ownerMint(address to, uint256 amount) external onlyOwner {
        require(totalMinted[PROMISE_TOKEN_ID] + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, PROMISE_TOKEN_ID, amount, "");
        totalMinted[PROMISE_TOKEN_ID] += amount;
    }

    /**
     * @notice Burn function matching Manifold's signature
     * @dev burn(address account, uint256[] tokenIds, uint256[] amounts)
     * @param account Address whose tokens to burn
     * @param tokenIds Array of token IDs to burn
     * @param amounts Array of amounts to burn
     */
    function burn(
        address account,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) external nonReentrant {
        require(tokenIds.length == amounts.length, "Length mismatch");
        require(
            account == msg.sender || isApprovedForAll(account, msg.sender),
            "Not owner or approved"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            _burn(account, tokenIds[i], amounts[i]);
        }
    }

    /**
     * @notice Owner can withdraw sale proceeds
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice Set new URI
     */
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
}
