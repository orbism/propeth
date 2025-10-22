# Quick Start - Deploy to Ethereum Sepolia

Copy-paste these commands in order.

---

## 1. Setup

```bash
# Navigate to contracts directory
cd apps/contracts

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts@v5.0.0 --no-commit
forge install foundry-rs/forge-std --no-commit
forge install smartcontractkit/chainlink --no-commit
```

---

## 2. Configure Environment

```bash
# Create .env from example
cp .env.example .env

# Edit .env with your editor
nano .env
```

**Required variables:**
```bash
PRIVATE_KEY=0x...                           # Your deployer wallet private key
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=...                       # Get from etherscan.io
PAYOUT_ADDRESS=0x...                        # Where mint proceeds go
ROYALTY_RECEIVER=0x...                      # Who receives royalties
PRICE_PER_PACK_WEI=10000000000000000       # 0.01 ETH default
```

**Get testnet ETH:** https://www.alchemy.com/faucets/ethereum-sepolia

---

## 3. Compile

```bash
# Clean and build
forge clean
forge build
```

---

## 4. Test (Optional)

```bash
# Run all tests
forge test -vvv

# Or just check they compile
forge test --list
```

---

## 5. Deploy

```bash
# Deploy to Ethereum Sepolia
forge script script/Deploy.s.sol \
  --rpc-url sepolia \
  --broadcast \
  --verify \
  --slow
```

**This will:**
- Deploy MockRandomness
- Deploy Pack1155
- Deploy BurnRedeemGateway
- Deploy Fortune721
- Configure royalties
- Verify on Etherscan
- Save addresses to `deployments/sepolia.json`

**Wait for:** "DEPLOYMENT SUMMARY" output

---

## 6. Save Addresses

Copy the addresses from the output:

```
MockRandomness:       0x...
Pack1155:             0x...
BurnRedeemGateway:    0x...
Fortune721:           0x...
```

---

## 7. Update Frontend

```bash
cd ../web
nano .env.local
```

Add deployed addresses:

```bash
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_PACK1155=0x...
NEXT_PUBLIC_BURN_GATEWAY=0x...
NEXT_PUBLIC_FORTUNE721=0x...
NEXT_PUBLIC_PRICE_PER_PACK_WEI=10000000000000000
NEXT_PUBLIC_ALCHEMY_KEY=...
```

---

## 8. Smoke Test

```bash
cd apps/contracts

# Mint a pack (replace ADDRESS with your wallet)
cast send $PACK1155_ADDRESS \
  "mintPack(address)" $YOUR_ADDRESS \
  --value 0.01ether \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY

# Check balance (for card ID 0)
cast call $PACK1155_ADDRESS \
  "balanceOf(address,uint256)" $YOUR_ADDRESS 0 \
  --rpc-url sepolia

# Mint fortune (replace with your 3 card IDs)
cast send $FORTUNE721_ADDRESS \
  "mintFromTriptych(uint256[3])" "[0,5,10]" \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY

# Check fortune owner
cast call $FORTUNE721_ADDRESS \
  "ownerOf(uint256)" 0 \
  --rpc-url sepolia
```

---

## 9. Verify on Etherscan

Visit: https://sepolia.etherscan.io/address/`YOUR_PACK1155_ADDRESS`

Check:
- ✅ Contract verified (green checkmark)
- ✅ "Events" tab shows transactions
- ✅ "Read Contract" works

---

## Done! 🎉

**Next steps:**
1. Build frontend (Phase 3)
2. Upload assets to IPFS (when ready)
3. Test full flow with UI

**Troubleshooting:** See DEPLOYMENT.md for detailed solutions