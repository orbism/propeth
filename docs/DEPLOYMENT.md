# Deployment Guide - Bezmiar Fortune Teller

Step-by-step guide to deploy contracts to Ethereum Sepolia testnet or Ethereum mainnet.

---

## Prerequisites

✅ Foundry installed (`forge --version`)  
✅ Git repository initialized  
✅ `.env` file configured  
✅ Deployer wallet funded with testnet ETH

---

## Step 1: Install Foundry Dependencies

```bash
cd apps/contracts

# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.0.0 --no-commit

# Install forge-std
forge install foundry-rs/forge-std --no-commit

# Install Chainlink (for future VRF if needed)
forge install smartcontractkit/chainlink --no-commit
```

---

## Step 2: Configure Environment Variables

Create `apps/contracts/.env` file:

```bash
cd apps/contracts
cp .env.example .env
```

Edit `.env` with your values:

```bash
# CRITICAL - Your deployer private key (NEVER COMMIT)
PRIVATE_KEY=0x...

# RPC Endpoints
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Block Explorer
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Contract Configuration
BASE_URI=ipfs://placeholder/
MAX_CARD_ID=15
PRICE_PER_PACK_WEI=10000000000000000
PAYOUT_ADDRESS=0x...
ROYALTY_RECEIVER=0x...
ROYALTY_BPS=500

# Fortune Config
FORTUNE_BASE_BG_CID=QmPlaceholder
```

**Get testnet ETH:**
- Ethereum Sepolia Faucet: https://www.alchemy.com/faucets/ethereum-sepolia
- Need ~0.1-0.2 ETH for deployment (mainnet will cost more)

---

## Step 3: Compile Contracts

```bash
cd apps/contracts

# Clean previous builds
forge clean

# Compile all contracts
forge build

# Should see: "Compiled successfully"
```

**Expected output:**
```
[⠊] Compiling...
[⠒] Compiling 25 files with 0.8.26
[⠢] Solc 0.8.26 finished in 3.21s
Compiler run successful!
```

---

## Step 4: Run Tests (Optional but Recommended)

```bash
# Run all tests
forge test -vvv

# Run with gas report
forge test --gas-report

# Run specific test file
forge test --match-path test/Pack.t.sol -vvv
```

**Expected:** All tests pass ✅

---

## Step 5: Deploy to Ethereum Sepolia

```bash
# Dry run first (simulation)
forge script script/Deploy.s.sol --rpc-url sepolia

# If simulation looks good, deploy for real
forge script script/Deploy.s.sol \
  --rpc-url sepolia \
  --broadcast \
  --verify \
  --slow
```

**Flags explained:**
- `--broadcast`: Actually send transactions
- `--verify`: Auto-verify on BaseScan
- `--slow`: Wait longer between txs (safer)

**What happens:**
1. Deploys MockRandomness
2. Deploys Pack1155
3. Deploys BurnRedeemGateway
4. Deploys Fortune721
5. Configures royalties
6. Saves addresses to `deployments/sepolia.json` (or mainnet.json)

**Example output:**
```
== Logs ==
Deploying from: 0x1234...
Deployer balance: 50000000000000000

=== Deploying MockRandomness ===
MockRandomness deployed at: 0xAbC123...

=== Deploying Pack1155 ===
Pack1155 deployed at: 0xDeF456...

=== Deploying BurnRedeemGateway ===
BurnRedeemGateway deployed at: 0x789GhI...

=== Deploying Fortune721 ===
Fortune721 deployed at: 0xJkL012...

================================================
DEPLOYMENT SUMMARY
================================================
MockRandomness:       0xAbC123...
Pack1155:             0xDeF456...
BurnRedeemGateway:    0x789GhI...
Fortune721:           0xJkL012...
================================================
```

---

## Step 6: Verify Contracts (if auto-verify failed)

If auto-verification failed, verify manually:

```bash
# Verify MockRandomness
forge verify-contract \
  <MOCK_RANDOMNESS_ADDRESS> \
  src/mocks/MockRandomness.sol:MockRandomness \
  --chain sepolia

# Verify Pack1155
forge verify-contract \
  <PACK1155_ADDRESS> \
  src/Pack1155.sol:Pack1155 \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(string,uint256,uint256,address,address)" "ipfs://placeholder/" 15 10000000000000000 <PAYOUT_ADDRESS> <RANDOMNESS_ADDRESS>)

# Verify BurnRedeemGateway
forge verify-contract \
  <GATEWAY_ADDRESS> \
  src/BurnRedeemGateway.sol:BurnRedeemGateway \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(address)" <PACK1155_ADDRESS>)

# Verify Fortune721
forge verify-contract \
  <FORTUNE721_ADDRESS> \
  src/Fortune721.sol:Fortune721 \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(string)" "QmPlaceholder")
```

---

## Step 7: Smoke Test on Testnet

Test the deployment with a real wallet:

### 7.1: Mint a Pack

```bash
# Using cast
cast send <PACK1155_ADDRESS> \
  "mintPack(address)" <YOUR_WALLET> \
  --value 0.01ether \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY
```

**Verify on Etherscan:**
- Go to https://sepolia.etherscan.io/address/<PACK1155_ADDRESS>
- Check "Events" tab
- Should see `PackMinted` event with 3 card IDs

### 7.2: Check Balances

```bash
# Check if you received cards (check IDs 0-14)
cast call <PACK1155_ADDRESS> \
  "balanceOf(address,uint256)" <YOUR_WALLET> 0 \
  --rpc-url sepolia

# Should return: 1 (if you got card ID 0)
```

### 7.3: Mint a Fortune

```bash
# Get the 3 card IDs from the PackMinted event
# Then mint fortune (example with cards 3, 7, 12)
cast send <FORTUNE721_ADDRESS> \
  "mintFromTriptych(uint256[3])" "[3,7,12]" \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY
```

### 7.4: Check Fortune TokenURI

```bash
cast call <FORTUNE721_ADDRESS> \
  "tokenURI(uint256)" 0 \
  --rpc-url sepolia
```

Should return base64-encoded JSON. Decode it:
```bash
cast call <FORTUNE721_ADDRESS> "tokenURI(uint256)" 0 --rpc-url sepolia | \
  sed 's/data:application\/json;base64,//' | \
  base64 -d | \
  jq
```

---

## Step 8: Update Frontend Environment

Copy deployed addresses to frontend:

```bash
cd apps/web
```

Edit `.env.local`:

```bash
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAIN_NAME=sepolia

# From deployment output
NEXT_PUBLIC_PACK1155=0x...
NEXT_PUBLIC_BURN_GATEWAY=0x...
NEXT_PUBLIC_FORTUNE721=0x...

NEXT_PUBLIC_PRICE_PER_PACK_WEI=10000000000000000

# Your RPC keys
NEXT_PUBLIC_ALCHEMY_KEY=...
NEXT_PUBLIC_INFURA_KEY=...
```

---

## Step 9: Document Deployed Addresses

Update `README.md`:

```markdown
### Ethereum Sepolia (Testnet)
- **Pack1155**: 0x...
- **BurnRedeemGateway**: 0x...
- **Fortune721**: 0x...
- **MockRandomness**: 0x...

**Deployed:** 2025-10-15
**Deployer:** 0x...
**Block:** #12345678
```

---

## Common Issues & Solutions

### Issue: "Insufficient funds"
**Solution:** Get more testnet ETH from faucet

### Issue: "Nonce too low"
**Solution:** 
```bash
# Reset nonce
cast nonce <YOUR_ADDRESS> --rpc-url sepolia
```

### Issue: "Verification failed"
**Solution:** Wait 1-2 minutes, then retry. Etherscan needs time to index.

### Issue: "RPC Error"
**Solution:** Check your Alchemy key is correct and has Ethereum Sepolia enabled

---

## Post-Deployment Checklist

- [ ] All contracts deployed successfully
- [ ] All contracts verified on Etherscan
- [ ] Smoke test completed (mint pack + fortune)
- [ ] Addresses documented in README.md
- [ ] Frontend `.env.local` updated
- [ ] Deployment addresses saved in `deployments/sepolia.json` or `deployments/mainnet.json`
- [ ] Git commit with deployment info

---

## Next Steps

1. **Upload Assets to IPFS**
   - Get the 91 PNG files from designer
   - Upload to IPFS
   - Set URIs in contracts

2. **Configure Burn Adapters** (optional)
   - Deploy adapters for specific collections
   - Set adapters in BurnRedeemGateway

3. **Build Frontend** (Phase 3)
   - Start developing UI with deployed contracts

---

## Useful Commands

```bash
# Check contract storage
cast storage <ADDRESS> <SLOT> --rpc-url sepolia

# Call view function
cast call <ADDRESS> "functionName()" --rpc-url sepolia

# Send transaction
cast send <ADDRESS> "functionName(args)" --rpc-url sepolia --private-key $PRIVATE_KEY

# Get transaction receipt
cast receipt <TX_HASH> --rpc-url sepolia

# Estimate gas
cast estimate <ADDRESS> "functionName(args)" --rpc-url sepolia
```

---

**Need help?** Check Foundry docs: https://book.getfoundry.sh/