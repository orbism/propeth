# Ethereum Mainnet Switch - Summary

**Date:** 2025-10-15  
**Change:** Base → Ethereum

---

## What Changed

### From (Base)
- Chain ID: 8453 (Base mainnet)
- Testnet: 84532 (Base Sepolia)
- RPC: `base-mainnet.g.alchemy.com`
- Explorer: BaseScan
- Faucet: Alchemy Base Sepolia

### To (Ethereum)
- Chain ID: 1 (Ethereum mainnet)
- Testnet: 11155111 (Ethereum Sepolia)
- RPC: `eth-mainnet.g.alchemy.com`
- Explorer: Etherscan
- Faucet: Alchemy Ethereum Sepolia

---

## Files Updated

### Contract Configuration
1. **`apps/contracts/.env.example`**
   - `BASE_RPC_URL` → `MAINNET_RPC_URL`
   - `BASE_SEPOLIA_RPC_URL` → `SEPOLIA_RPC_URL`
   - `BASESCAN_API_KEY` → `ETHERSCAN_API_KEY`
   - Updated VRF coordinator addresses for Ethereum

2. **`apps/contracts/foundry.toml`**
   - Removed `base` and `base_sepolia` endpoints
   - Added `mainnet` and `sepolia` endpoints
   - Updated Etherscan config

3. **`apps/contracts/script/Deploy.s.sol`**
   - Updated `_getChainName()` function
   - Returns "mainnet" or "sepolia"

### Frontend Configuration
4. **`apps/web/.env.example`**
   - `NEXT_PUBLIC_CHAIN_ID=1` (was 8453)
   - `NEXT_PUBLIC_CHAIN_NAME=mainnet` (was base)
   - Updated RPC URL references

5. **`apps/web/lib/wagmi.ts`**
   - `import { mainnet, sepolia }` (was base, baseSepolia)
   - Updated chain configurations
   - Updated RPC transport URLs

### Documentation
6. **`DEPLOYMENT.md`**
   - All "Base Sepolia" → "Ethereum Sepolia"
   - All "BaseScan" → "Etherscan"
   - Updated RPC URLs and faucet links
   - Updated verification commands

7. **`QUICKSTART.md`**
   - Updated all commands for Ethereum
   - New chain IDs and RPC endpoints
   - Etherscan verification

8. **`README.md`**
   - Updated deployed contracts section
   - Changed chain references
   - Updated configuration docs

9. **`FILETREE.md`**
   - `deployments/mainnet.json` (was base.json)
   - `deployments/sepolia.json` (was base-sepolia.json)

10. **`scratchpad.md`**
    - Noted mainnet switch

---

## Key Differences: Base vs Ethereum

### Gas Costs
- **Ethereum:** Higher gas costs (~10-50x Base)
- **Base:** Lower gas costs (L2 optimization)
- **Impact:** Deployment will cost more on Ethereum (~0.1-0.2 ETH vs ~0.03 ETH)

### Network Speed
- **Ethereum:** ~12 second block times
- **Base:** ~2 second block times
- **Impact:** Slower transaction confirmations

### Ecosystem
- **Ethereum:** More mature, wider adoption
- **Base:** Newer, Coinbase-backed L2
- **Impact:** Higher visibility on Ethereum mainnet

### Testnet Faucets
- **Ethereum Sepolia:** https://www.alchemy.com/faucets/ethereum-sepolia
- **Base Sepolia:** https://www.alchemy.com/faucets/base-sepolia

---

## What Stays The Same

✅ All smart contract code (unchanged)  
✅ All tests (pass identically)  
✅ Security features (same guarantees)  
✅ Deployment workflow (same steps)  
✅ Frontend functionality (same UX)  
✅ Asset requirements (1 background PNG)  

---

## Deployment Cost Estimates

### Ethereum Sepolia (Testnet)
- Deploy 4 contracts: ~0.1-0.2 ETH
- Load 90 text strings: ~0.02-0.05 ETH
- **Total:** ~0.15-0.25 ETH (testnet, free from faucet)

### Ethereum Mainnet
- Deploy 4 contracts: **~0.15-0.3 ETH** (~$400-$800 at current prices)
- Load 90 text strings: **~0.03-0.08 ETH** (~$80-$200)
- **Total:** **~0.2-0.4 ETH** (~$500-$1000)

*Note: Costs vary with gas prices. Deploy during low-gas periods for savings.*

### Base Mainnet (for comparison)
- Deploy 4 contracts: ~0.01-0.03 ETH
- Load 90 text strings: ~0.005-0.01 ETH
- **Total:** ~0.015-0.04 ETH (~$40-$100)

---

## Migration Path (If Switching Back to Base)

If you need to switch back to Base:

1. Revert changes to these files:
   - `.env.example` (both contracts and web)
   - `foundry.toml`
   - `Deploy.s.sol`
   - `lib/wagmi.ts`

2. Change chain IDs back:
   - Mainnet: 8453
   - Testnet: 84532

3. Update RPC URLs to Base endpoints

4. Use BaseScan for verification

---

## Testing on Sepolia vs Mainnet

### Sepolia Testnet (Recommended First)
- Free testnet ETH from faucet
- Test full deployment flow
- Verify contracts work
- Test fortune generation
- Build and test frontend
- **Then** deploy to mainnet

### Mainnet Deployment
- Only after successful Sepolia testing
- Requires real ETH for gas
- Permanent deployment
- Higher visibility
- Production-ready

---

## Updated Commands Reference

### Deploy to Sepolia
```bash
forge script script/Deploy.s.sol \
  --rpc-url sepolia \
  --broadcast \
  --verify \
  --slow
```

### Deploy to Mainnet
```bash
forge script script/Deploy.s.sol \
  --rpc-url mainnet \
  --broadcast \
  --verify \
  --slow
```

### Load Text Data (Sepolia)
```bash
forge script script/LoadTexts.s.sol \
  --rpc-url sepolia \
  --broadcast
```

### Load Text Data (Mainnet)
```bash
forge script script/LoadTexts.s.sol \
  --rpc-url mainnet \
  --broadcast
```

---

## Verification Commands

### Sepolia
```bash
forge verify-contract \
  <ADDRESS> \
  <CONTRACT> \
  --chain sepolia \
  --constructor-args <ARGS>
```

### Mainnet
```bash
forge verify-contract \
  <ADDRESS> \
  <CONTRACT> \
  --chain mainnet \
  --constructor-args <ARGS>
```

---

## Next Steps

1. ✅ **All files updated** for Ethereum
2. ⏳ **Get 1 background PNG** from designer
3. ⏳ **Deploy to Sepolia** for testing
4. ⏳ **Test full flow** on testnet
5. ⏳ **Deploy to mainnet** when ready
6. ⏳ **Build frontend** (Phase 3)

---

## Rollback Instructions

If you need to undo this change and go back to Base:

```bash
# In git (if committed)
git revert <commit-hash>

# Or manually:
# 1. Change chain IDs back (1→8453, 11155111→84532)
# 2. Update RPC URLs (eth-mainnet→base-mainnet)
# 3. Update explorer (Etherscan→BaseScan)
# 4. Revert wagmi.ts chains (mainnet→base, sepolia→baseSepolia)
```

---

**All configurations now target Ethereum mainnet and Sepolia testnet.**