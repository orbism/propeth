# Bezmiar Fortune Teller

A mystical NFT fortune-telling experience on Ethereum.

## Overview

Users purchase card packs containing 3 randomly drawn cards from a deck of 15. These cards form a "triptych" that generates a unique on-chain fortune NFT with procedurally composed text and imagery.

## Architecture

### Smart Contracts (`apps/contracts/`)

- **Pack1155Upgradeable** - ERC-1155 contract for card pack minting
- **Fortune721Upgradeable** - ERC-721 contract for fortune NFTs with on-chain SVG generation

Both contracts are UUPS upgradeable with a two-tier admin system (Owner + Admin).

See [contracts README](apps/contracts/README.md) for admin function reference.

### Frontend (`apps/web/`)

Next.js application with:
- Wallet connection (WalletConnect/Web3Modal)
- Card pack purchasing and reveal
- Fortune generation and display
- Reading history

## Quick Start

### Contracts

```bash
cd apps/contracts
forge build
forge test
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

## Configuration

### IPFS Gateway

The project uses `https://propeth.4everland.link/ipfs/` as the IPFS gateway for fast, reliable media loading.

Configure in `apps/web/.env.local`:
```env
NEXT_PUBLIC_IPFS_GATEWAY_URL=https://propeth.4everland.link/ipfs/
```

### Contract Addresses

After deployment, update `apps/web/.env.local`:
```env
NEXT_PUBLIC_PACK1155=<Pack1155 proxy address>
NEXT_PUBLIC_FORTUNE721=<Fortune721 proxy address>
```
