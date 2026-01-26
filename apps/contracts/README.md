# Bezmiar Fortune Teller - Smart Contracts

UUPS upgradeable smart contracts for the Bezmiar Fortune Teller NFT project.

## Contracts

### Pack1155Upgradeable

ERC-1155 contract for minting card packs. Users pay to receive 3 random cards from a pool of 15.

### Fortune721Upgradeable

ERC-721 contract for fortune NFTs. Generates on-chain SVG fortunes composed from a triptych of 3 cards.

## Admin Features

Both contracts support a two-tier admin system: **Owner** and **Admin**.

### Pack1155Upgradeable

| Function | Permission | Description |
|----------|------------|-------------|
| `setAdmin(address)` | Owner only | Set/change admin address |
| `setPayoutAddress(address)` | Owner only | Change withdrawal destination |
| `setGateway(address)` | Owner only | Set gateway contract for free mints |
| `withdraw()` | Owner only | Withdraw contract balance |
| `_authorizeUpgrade(address)` | Owner only | Authorize contract upgrade |
| `pause()` | Owner or Admin | Pause minting |
| `unpause()` | Owner or Admin | Resume minting |
| `setURI(string)` | Owner or Admin | Update metadata base URI |
| `setPrice(uint256)` | Owner or Admin | Update mint price |
| `setMaxSupply(uint256, uint256)` | Owner or Admin | Set max supply per card ID |
| `setRandomnessSource(address)` | Owner or Admin | Update randomness source |
| `setRoyalty(address, uint96)` | Owner or Admin | Set royalty info (ERC-2981) |
| `rotateEntropyEpoch()` | Owner or Admin | Rotate entropy for randomness |

### Fortune721Upgradeable

| Function | Permission | Description |
|----------|------------|-------------|
| `setAdmin(address)` | Owner only | Set/change admin address |
| `setPayoutAddress(address)` | Owner only | Change withdrawal destination |
| `withdraw()` | Owner only | Withdraw contract balance |
| `_authorizeUpgrade(address)` | Owner only | Authorize contract upgrade |
| `pause()` | Owner or Admin | Pause minting |
| `unpause()` | Owner or Admin | Resume minting |
| `setBaseBgCID(string)` | Owner or Admin | Update SVG background IPFS CID |
| `setFontURI(string)` | Owner or Admin | Update custom font URI |
| `setFragmentText(uint256, uint256, uint256, string)` | Owner or Admin | Set fortune text fragments |
| `setRoyalty(address, uint96)` | Owner or Admin | Set royalty info (ERC-2981) |
| `setGlobalSalt(bytes32)` | Owner or Admin | Manually set entropy salt |
| `rotateGlobalSalt()` | Owner or Admin | Auto-rotate entropy salt |

## IPFS Configuration

The contracts use `https://propeth.4everland.link/ipfs/` as the IPFS gateway for:
- SVG background images in Fortune721 tokenURI
- Metadata references should use this gateway for faster loading on marketplaces

## Development

### Build

```shell
forge build
```

### Test

```shell
forge test
```

### Deploy

See `script/` directory for deployment scripts.

## Dependencies

- OpenZeppelin Contracts Upgradeable v5.x
- Foundry / Forge
