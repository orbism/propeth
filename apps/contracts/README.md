# Bezmiar Fortune Teller - Smart Contracts

UUPS upgradeable smart contracts for the Bezmiar Fortune Teller NFT project.

## Contracts

### Pack1155Upgradeable

ERC-1155 contract for minting card packs. Users pay to receive 3 random cards from a pool of 15.

### Fortune721Upgradeable

ERC-721 contract for fortune NFTs. Generates on-chain SVG fortunes composed from a triptych of 3 cards.

## Deployment

### Sepolia (Testnet)

```bash
forge script script/DeployUpgradeableSepolia.s.sol --rpc-url sepolia --broadcast --verify
```

### Mainnet

```bash
forge script script/DeployUpgradeableMainnet.s.sol --rpc-url mainnet --broadcast --verify
```

### Local (Anvil)

```bash
# Start local node
anvil

# Deploy
forge script script/DeployUpgradeableSepolia.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

## Admin Features

Both contracts support a two-tier admin system: **Owner** and **Admin**.

### Pack1155Upgradeable

| Function | Permission | Description |
|----------|------------|-------------|
| `setAdmin(address)` | Owner only | Set/change admin address |
| `setPayoutAddress(address)` | Owner only | Change withdrawal destination |
| `setGateway(address)` | Owner only | Set gateway contract for free mints |
| `setFortune721(address)` | Owner only | Link Fortune721 contract |
| `withdraw()` | Owner only | Withdraw contract balance |
| `_authorizeUpgrade(address)` | Owner only | Authorize contract upgrade |
| `pause()` | Owner or Admin | Pause minting |
| `unpause()` | Owner or Admin | Resume minting |
| `setURI(string)` | Owner or Admin | Update metadata base URI |
| `setPrice(uint256)` | Owner or Admin | Update mint price |
| `setMaxSupply(uint256, uint256)` | Owner or Admin | Set max supply per card ID |
| `setMaxSupplyBatch(uint256[], uint256[])` | Owner or Admin | Batch set max supplies |
| `setRandomnessSource(address)` | Owner or Admin | Update randomness source |
| `setRoyalty(address, uint96)` | Owner or Admin | Set royalty info (ERC-2981) |
| `rotateEntropyEpoch()` | Owner or Admin | Rotate entropy for randomness |

### Fortune721Upgradeable

| Function | Permission | Description |
|----------|------------|-------------|
| `setAdmin(address)` | Owner only | Set/change admin address |
| `setPayoutAddress(address)` | Owner only | Change withdrawal destination |
| `setPack1155(address)` | Owner only | Link Pack1155 contract |
| `withdraw()` | Owner only | Withdraw contract balance |
| `_authorizeUpgrade(address)` | Owner only | Authorize contract upgrade |
| `pause()` | Owner or Admin | Pause minting |
| `unpause()` | Owner or Admin | Resume minting |
| `setBaseBgCID(string)` | Owner or Admin | Update SVG background IPFS CID |
| `setFontURI(string)` | Owner or Admin | Update custom font URI |
| `setFragmentText(uint256, uint256, uint256, string)` | Owner or Admin | Set fortune text fragments |
| `setFragmentTextBatch(...)` | Owner or Admin | Batch set text fragments |
| `setRoyalty(address, uint96)` | Owner or Admin | Set royalty info (ERC-2981) |
| `setGlobalSalt(bytes32)` | Owner or Admin | Manually set entropy salt |
| `rotateGlobalSalt()` | Owner or Admin | Auto-rotate entropy salt |

## Contract Linkage

The contracts are bidirectionally linked for state management:

```
Pack1155 <--> Fortune721
   |
   v
BurnRedeemGateway
```

- `Pack1155.setFortune721(address)` - Links to Fortune721 for checking fortune creation
- `Fortune721.setPack1155(address)` - Links to Pack1155 for resetUserState authorization
- `Pack1155.setGateway(address)` - Authorizes gateway for free mints

## IPFS Configuration

**Gateway:** `https://propeth.4everland.link/ipfs/`

**Current CIDs:**
- Metadata: `bafybeiaycox2yhtj23daaicey2vfx464hhipyuxfxiscmqujjn7xte72sm`
- Fortune Background: `bafybeih3foatdgwucci5whnyhewkpc7c7w4y37birvsla6gjrdmg7d62va`

## Upgrading Contracts

Both contracts use the UUPS upgrade pattern. To upgrade:

1. Deploy new implementation contract
2. Call `upgradeTo(newImplementation)` on the proxy (owner only)

```bash
# Example upgrade script
cast send <PROXY_ADDRESS> "upgradeTo(address)" <NEW_IMPL_ADDRESS> --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
```

## Development

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Gas Snapshots

```bash
forge snapshot
```

## Dependencies

- OpenZeppelin Contracts v5.x
- OpenZeppelin Contracts Upgradeable v5.x
- Foundry / Forge
