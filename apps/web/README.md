# Bezmiar Fortune Teller

> A minimal, secure Web3 NFT fortune-telling experience on Ethereum.

---

## Overview

Bezmiar Fortune Teller is a mystical Web3 experience where users acquire exactly 3 random ERC-1155 "card" NFTs through a single transaction, then combine them to mint a unique ERC-721 "fortune" NFT with on-chain SVG artwork derived from their specific card combination.

### Key Features

- **Dual Mint Paths**: Burn approved NFTs or pay to mint fresh cards
- **Enforced Pack Size**: Exactly 3 cards per transaction, no more, no less
- **Deterministic Fortunes**: On-chain SVG fortunes generated from card combinations
- **Gas Efficient**: Optimized for minimal transaction costs
- **Secure**: Reentrancy guards, supply caps, provable randomness
- **Minimal Design**: Black-and-white UI, fast load times

---

## Architecture

### Smart Contracts

#### Pack1155 (ERC-1155)
- Mints packs of exactly 3 random card NFTs
- Enforces per-ID supply caps
- Configurable pricing and royalties
- Pausable for emergency stops

#### BurnRedeemGateway
- Verifies and burns/escrows approved external NFTs
- Modular adapter system for different token types
- Calls Pack1155 to mint 3 cards as redemption

#### Fortune721 (ERC-721)
- Mints unique fortune NFTs from card triptychs
- On-chain SVG + JSON assembly (no IPFS dependency)
- Deterministic artwork from card combination
- 4-layer composition: background + 3 text fragments

#### Burn Adapters
- DirectBurn721/1155: Direct burn() calls
- DeadTransfer721/1155: Transfer to burn address
- Pluggable for different external collection policies

### Frontend Stack

- **Framework**: Next.js 15 (App Router)
- **Web3**: wagmi v2 + viem
- **Wallet**: Web3Modal v2 (no API keys required)
- **State**: Zustand
- **Styling**: Tailwind CSS (minimal B/W theme)
- **Animations**: Framer Motion (light)

---

## Project Structure

```
bezmiar-fortune-teller/
├── apps/
│   ├── contracts/     # Foundry Solidity contracts
│   └── web/           # Next.js frontend
└── docs/              # Documentation
```

See [FILETREE.md](./FILETREE.md) for complete structure.

---

## Quick Start

See [SETUP.md](./SETUP.md) for detailed installation and deployment instructions.

### Prerequisites

- Node.js >= 18
- Foundry
- Alchemy/Infura API keys
- BaseScan API key

### Install

```bash
# Contracts
cd apps/contracts
forge install
forge build
forge test

# Frontend
cd apps/web
npm install
npm run dev
```

---

## User Flow

1. **Landing**: Connect wallet, view hero video
2. **Choice**: Select "Burn to Redeem" or "Mint from Scratch"
3. **Mint**: Execute single transaction for 3 cards
4. **Triptych**: View acquired cards
5. **Fortune**: Mint unique fortune from card combination
6. **Share**: Links to OpenSea/MagicEden, restart flow

---

## Development Status

**Phase 0**: ✅ Complete - Project setup  
**Phase 1**: 🔄 In Progress - Smart contracts  
**Phase 2**: ⏳ Pending - Contract deployment  
**Phase 3**: ⏳ Pending - Frontend foundation  
**Phase 4**: ⏳ Pending - Web3 integration  
**Phase 5**: ⏳ Pending - Main user flow  
**Phase 6**: ⏳ Pending - Asset management  
**Phase 7**: ⏳ Pending - Testing & security  
**Phase 8**: ⏳ Pending - Documentation  
**Phase 9**: ⏳ Pending - Mainnet launch

See [scratchpad.md](./scratchpad.md) for detailed progress tracking.

---

## Deployed Contracts

### Ethereum Mainnet
- **Pack1155**: TBD
- **BurnRedeemGateway**: TBD
- **Fortune721**: TBD

### Ethereum Sepolia (Testnet)
- **Pack1155**: TBD
- **BurnRedeemGateway**: TBD
- **Fortune721**: TBD

---

## Security

### Audited Features
- ✅ No tx.origin usage
- ✅ Reentrancy guards on external functions
- ✅ Checked arithmetic (Solidity 0.8.26+)
- ✅ Supply cap enforcement
- ✅ Pausable circuit breakers
- ✅ Admin role protection

### Randomness
- **Mode**: Commit-reveal (default) or Chainlink VRF
- **Anti-gaming**: Combines user commitment with block.prevrandao
- **Fairness**: Fisher-Yates shuffle with rejection sampling

See [plan.md](./plan.md) section 10 for complete security checklist.

---

## Configuration

### Environment Variables

#### Contracts (`apps/contracts/.env`)
- `MAINNET_RPC_URL` - Alchemy/Infura Ethereum RPC
- `SEPOLIA_RPC_URL` - Alchemy/Infura Sepolia RPC
- `PRIVATE_KEY` - Deployer private key
- `ETHERSCAN_API_KEY` - Contract verification
- `PRICE_PER_PACK_WEI` - Pack price
- `ROYALTY_BPS` - Royalty percentage

#### Frontend (`apps/web/.env.local`)
- `NEXT_PUBLIC_CHAIN_ID` - Target chain (1 for mainnet, 11155111 for Sepolia)
- `NEXT_PUBLIC_ALCHEMY_KEY` - Alchemy API key
- `NEXT_PUBLIC_PACK1155` - Pack1155 contract address
- `NEXT_PUBLIC_BURN_GATEWAY` - BurnRedeemGateway address
- `NEXT_PUBLIC_FORTUNE721` - Fortune721 address

See `.env.example` files for complete lists.

---

## Testing

### Contracts

```bash
cd apps/contracts

# Run all tests
forge test -vvv

# Gas report
forge test --gas-report

# Coverage
forge coverage

# Specific test
forge test --match-test testMintPackExactlyThree -vvv
```

### Frontend

```bash
cd apps/web

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Contributing

This is a private project. See [plan.md](./plan.md) for detailed specifications and development guidelines.

---

## License

Private - All Rights Reserved

---

## Contact

For questions or support, please contact the project team.

---

**Built with ⚡ on Base**