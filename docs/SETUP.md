# Bezmiar Fortune Teller - Initial Setup

> One-time setup guide for building and deploying the project from scratch.

---

## Prerequisites

- **Node.js** >= 18.0.0
- **Foundry** (forge, cast, anvil)
- **Git**
- **Alchemy Account** (for RPC)
- **BaseScan API Key** (for contract verification)

---

## 1. Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd bezmiar-fortune-teller

# Install Foundry dependencies
cd apps/contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.0.0
forge install smartcontractkit/chainlink
forge install foundry-rs/forge-std

# Install web dependencies
cd ../web
npm install

cd ../..
```

---

## 2. Environment Configuration

### Contracts

```bash
cd apps/contracts
cp .env.example .env
```

Edit `.env` and fill in:
- `BASE_RPC_URL` - Alchemy Base mainnet endpoint
- `BASE_SEPOLIA_RPC_URL` - Alchemy Base Sepolia testnet endpoint
- `BASESCAN_API_KEY` - Get from https://basescan.org/
- `PRIVATE_KEY` - Deployer wallet private key (NEVER COMMIT)
- `PAYOUT_ADDRESS` - Address to receive mint proceeds
- `ROYALTY_RECEIVER` - Address to receive royalties
- `ROYALTY_BPS` - Royalty basis points (500 = 5%)
- `PRICE_PER_PACK_WEI` - Price per 3-card pack in wei

### Frontend

```bash
cd apps/web
cp .env.example .env.local
```

Edit `.env.local` and fill in:
- `NEXT_PUBLIC_ALCHEMY_KEY` - Your Alchemy API key
- `NEXT_PUBLIC_INFURA_KEY` - Your Infura API key (fallback)
- Contract addresses (after deployment)

---

## 3. Build & Test Contracts

```bash
cd apps/contracts

# Compile contracts
forge build

# Run tests
forge test -vvv

# Generate gas report
forge test --gas-report

# Check coverage
forge coverage
```

---

## 4. Deploy to Testnet

```bash
cd apps/contracts

# Deploy to Base Sepolia
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify

# Note the deployed contract addresses
# Update apps/web/.env.local with addresses
```

---

## 5. Run Frontend Locally

```bash
cd apps/web

# Development server
npm run dev

# Open http://localhost:3000
```

---

## 6. Test End-to-End Flow

1. Connect wallet (use testnet account with test ETH)
2. Mint a pack (3 cards)
3. Verify cards received
4. Mint fortune from triptych
5. Check fortune NFT display

---

## 7. Deploy to Mainnet (When Ready)

### Contracts

```bash
cd apps/contracts

# Final audit check
forge test
forge coverage

# Deploy to Base mainnet
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify --slow

# Verify all contracts on BaseScan
# Update production env with mainnet addresses
```

### Frontend

```bash
cd apps/web

# Build production bundle
npm run build

# Deploy to Vercel/preferred host
vercel deploy --prod

# Or self-host
npm run start
```

---

## 8. Post-Deployment Checklist

- [ ] All contracts verified on BaseScan
- [ ] Smoke test with real wallet on mainnet
- [ ] Set royalty receiver and percentage
- [ ] Configure burn adapters for eligible collections
- [ ] Upload card assets to IPFS
- [ ] Set baseURI in Pack1155 contract
- [ ] Upload fortune text pools
- [ ] Test complete user flow
- [ ] Monitor transactions and events
- [ ] Announce launch

---

## Common Commands

### Foundry

```bash
# Install new dependency
forge install <org>/<repo>@<version>

# Update dependencies
forge update

# Clean build artifacts
forge clean

# Format code
forge fmt
```

### Frontend

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Clean build
rm -rf .next
npm run build
```

---

## Troubleshooting

### "RPC Error: Insufficient funds"
- Ensure deployer wallet has enough ETH for gas

### "Contract verification failed"
- Check BASESCAN_API_KEY is correct
- Verify constructor arguments match deployment
- Use `--verify` flag with deployment script

### "Wallet connection failed"
- Check RPC endpoints are accessible
- Verify chain ID matches (8453 for Base)
- Clear browser cache and reconnect

### "Transaction reverted"
- Check contract is not paused
- Verify msg.value matches price
- Ensure supply not exhausted
- Check allowances for burn redeem

---

## Support

See `README.md` for architecture overview and `plan.md` for detailed specifications.

---

**Initial setup complete! Proceed to Phase 1 development.**