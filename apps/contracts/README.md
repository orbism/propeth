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
forge script script/DeployUpgradeableSepolia.s.sol \
  --rpc-url sepolia \
  --broadcast \
  --priority-gas-price 100000000 \
  --with-gas-price 3000000000

# If transactions get stuck, add --slow
forge script script/DeployUpgradeableSepolia.s.sol \
  --rpc-url sepolia \
  --broadcast \
  --slow \
  --priority-gas-price 100000000 \
  --with-gas-price 3000000000
```

### Mainnet

```bash
# PAYOUT_ADDRESS is required for mainnet
PAYOUT_ADDRESS=0x... forge script script/DeployUpgradeableMainnet.s.sol \
  --rpc-url mainnet \
  --broadcast \
  --priority-gas-price 500000000 \
  --with-gas-price <check_gas_tracker>
```

### Local (Anvil)

```bash
anvil
forge script script/DeployUpgradeableSepolia.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### Gas Configuration

| Flag | Purpose | Sepolia | Mainnet |
|------|---------|---------|---------|
| `--priority-gas-price` | Tip (wei) | 0.1 gwei | 0.5-1 gwei |
| `--with-gas-price` | Max fee (wei) | 3 gwei | Check tracker |
| `--slow` | Wait for confirmations | Use if stuck | Recommended |

Deployment uses batch transactions (~10 total txs). Verify after with `node scripts/verify-contracts.js`.

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

## Security

### Fortune Minting Validation

`Fortune721.mintFromTriptych()` validates that the provided card IDs match the caller's `lastThreeCardsMinted` from Pack1155. This prevents users from:
- Minting fortunes with arbitrary card IDs they never received
- Bypassing the "one pack per user until fortune created" limitation
- Repeatedly minting packs by gaming the `fortuneCreatedFromLastThree` flag

### Why No Card Ownership Check?

The fortune minting function validates cards against `Pack1155.lastThreeCardsMinted` but does **not** require the user to still hold those cards (`balanceOf > 0`). This is intentional:

1. **Prevents user lockout**: If a user sells/transfers their cards before creating a fortune, requiring ownership would permanently lock them out of the system (can't make fortune → can't mint new pack → stuck forever).

2. **Fortune represents the reading, not the cards**: The fortune NFT commemorates the *reading* a user received from their minted cards. The cards themselves are separate collectibles that can be traded independently.

3. **Intended flow is preserved**: The system ensures fortunes are created from cards that were *actually minted to that user*, not arbitrary cards. This maintains the integrity of the reading experience.

4. **Economic flexibility**: Users can sell cards on secondary markets without breaking the core loop. They still must complete their reading (fortune) before getting new cards.

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

## Contract Verification

After deployment, verify contracts on Etherscan:

```bash
# Verify from latest broadcast (recommended)
node scripts/verify-contracts.js

# Verify for mainnet
node scripts/verify-contracts.js --chain mainnet

# Verify using addresses from frontend .env.local
node scripts/verify-contracts.js --env ../web/.env.local
```

The script uses Etherscan V2 API configured in `foundry.toml`. Requires `ETHERSCAN_API_KEY` in your `.env` file.

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
