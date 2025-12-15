// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockNFTWithSale
 * @notice Mock ERC721 with 200 supply, 50 sent to occvlt.eth, rest available for sale by owner
 */
contract MockNFTWithSale is ERC721, Ownable {
    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 200;
    uint256 public constant INITIAL_MINT = 50;
    address public occvltAddress;
    
    uint256 public salePrice;
    bool public saleActive;

    event SalePriceUpdated(uint256 newPrice);
    event SaleStatusUpdated(bool active);

    /**
     * @notice Initializes contract and mints initial 50 tokens to occvlt address
     * @param _occvlt Address to receive initial 50 tokens
     */
    constructor(address _occvlt) ERC721("Bezmiar Promise", "PROMISE") Ownable(msg.sender) {
        require(_occvlt != address(0), "Invalid occvlt address");
        occvltAddress = _occvlt;
        
        // Mint 50 to occvlt
        for (uint256 i = 0; i < INITIAL_MINT; i++) {
            _safeMint(_occvlt, _nextTokenId++);
        }
        
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
     * @notice Public purchase function
     */
    function purchase() external payable {
        require(saleActive, "Sale not active");
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= salePrice, "Insufficient payment");

        _safeMint(msg.sender, _nextTokenId++);
    }

    /**
     * @notice Owner can mint to any address (for airdrops, etc)
     * @param to Recipient address
     */
    function ownerMint(address to) external onlyOwner {
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");
        _safeMint(to, _nextTokenId++);
    }

    /**
     * @notice Get total minted count
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Owner can withdraw sale proceeds
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
