# Text-Based Fortune Approach - Implementation Summary

**Date:** 2025-10-15  
**Status:** Refactored and Ready for Deployment

---

## Overview

Successfully pivoted from **91 PNG image fragments** to **on-chain text + 1 background image**.

### Before (Image Approach)
- 1 base background PNG
- 90 fragment overlay PNGs (15 cards × 3 positions × 2 variants)
- All fragments stored as IPFS CIDs
- SVG composed of 4 layered `<image>` tags
- **Total:** 91 PNG files needed

### After (Text Approach - Option 3 Hybrid)
- 1 base background PNG
- 90 text strings stored on-chain
- Optional: 1 custom font file (IPFS)
- SVG composed of 1 `<image>` + 3 `<text>` elements
- **Total:** 1-2 files needed

---

## What Changed

### Fortune721.sol Contract

**Mapping:**
```solidity
// OLD
mapping(uint256 => mapping(uint256 => mapping(uint256 => string))) public fragmentCIDs;

// NEW
mapping(uint256 => mapping(uint256 => mapping(uint256 => string))) public fragmentTexts;
```

**New Fields:**
```solidity
string public fontURI;  // Optional IPFS font file
```

**New Functions:**
```solidity
function setFontURI(string calldata _uri) external onlyOwner;
function setFragmentText(...) external onlyOwner;
function setFragmentTextBatch(...) external onlyOwner;
```

**tokenURI() Output:**
```svg
<svg viewBox="0 0 1000 1000">
  <!-- Optional custom font -->
  <defs><style>@font-face{...}</style></defs>
  
  <!-- Background image -->
  <image href="ipfs://QmBackground..." width="1000" height="1000"/>
  
  <!-- Three text lines -->
  <text x="500" y="350" fill="#fff" font-size="32">Text 1</text>
  <text x="500" y="500" fill="#fff" font-size="32">Text 2</text>
  <text x="500" y="650" fill="#fff" font-size="32">Text 3</text>
</svg>
```

---

## prophet.csv Data Structure

| Card Name | Card 1 A | Card 1 B | Card 2 A | Card 2 B | Card 3 A | Card 3 B |
|-----------|----------|----------|----------|----------|----------|----------|
| The End | No ending is absolute | The end can be the beginning | but struggle will come to an end. | before peace returns. | The sadness will end. | Now it's time to reflect. |
| Pain | Pain is teaching you something | Suffering will make you stronger | that lies beyond your understanding. | if you allow it. | You will find your way. | Endure to heal. |
| ... | ... | ... | ... | ... | ... | ... |

**Total:** 15 cards, each with 6 text fragments (3 positions × 2 variants)

---

## How Fortune Generation Works

### Example: Cards [5, 0, 7]

1. **Draw 3 random card IDs:** 5, 0, 7 (no duplicates)
2. **Assign positions:** 
   - Card 5 → Position 1
   - Card 0 → Position 2
   - Card 7 → Position 3
3. **Select variants (50/50 random):**
   - Position 1: Variant B (1)
   - Position 2: Variant A (0)
   - Position 3: Variant B (1)
4. **Compose fortune:**
   ```
   "Every question hides an answer" +
   "but struggle will come to an end." +
   "Write your own story."
   ```

### Total Combinations
- **Cards:** C(15,3) = 455 combinations
- **Order:** 3! = 6 permutations
- **Variants:** 2³ = 8 possibilities
- **Total:** 455 × 6 × 8 = **21,840 unique fortunes**

---

## Deployment Workflow

### Step 1: Deploy Contracts
```bash
cd apps/contracts
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
```

**Deploys:**
- MockRandomness
- Pack1155
- BurnRedeemGateway
- Fortune721 (empty, no text yet)

### Step 2: Upload Assets to IPFS

**Background:**
```bash
ipfs add fortune-background.png
# Returns: QmBackground123...
```

**Font (optional):**
```bash
ipfs add fortune-font.woff2
# Returns: QmFont456...
```

### Step 3: Configure Fortune721

```bash
# Set background
cast send $FORTUNE721 \
  "setBaseBgCID(string)" "QmBackground123..." \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY

# Set font (optional)
cast send $FORTUNE721 \
  "setFontURI(string)" "ipfs://QmFont456..." \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY
```

### Step 4: Load Text Data

```bash
# Set Fortune721 address in .env
echo "FORTUNE721_ADDRESS=0x..." >> .env

# Run text loading script
forge script script/LoadTexts.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --slow
```

**This loads all 90 text fragments from prophet.csv into the contract.**

---

## Gas Costs

### Text Loading (one-time)
- **90 calls to setFragmentText()**
- Estimated: ~0.01-0.02 ETH total (on Base Sepolia testnet)
- Alternative: Use `setFragmentTextBatch()` to reduce calls

### Per-Fortune Mint
- Same as before (tokenURI generated on-demand, not stored)
- Slightly cheaper SVG generation (text vs image tags)

---

## Updating Text Later

**Easy updates without re-deployment:**

```bash
# Update a single text fragment
cast send $FORTUNE721 \
  "setFragmentText(uint256,uint256,uint256,string)" \
  5 2 1 "New text for card 5, position 2, variant B" \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY
```

**Can iterate on fortune text without touching IPFS or re-uploading files.**

---

## Testing

### Run Contract Tests
```bash
cd apps/contracts
forge test -vvv --match-path test/Fortune.t.sol
```

**All tests updated for text-based approach.**

### Test Fortune Generation Manually
```bash
# After deployment and text loading:

# Mint a pack (get 3 card IDs)
cast send $PACK1155 "mintPack(address)" $YOUR_WALLET \
  --value 0.01ether \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY

# Mint fortune (replace with your card IDs)
cast send $FORTUNE721 "mintFromTriptych(uint256[3])" "[5,0,7]" \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY

# Get tokenURI (will show base64-encoded JSON+SVG)
cast call $FORTUNE721 "tokenURI(uint256)" 0 \
  --rpc-url base_sepolia
```

---

## Advantages of This Approach

✅ **Simpler assets:** 1-2 files instead of 91  
✅ **On-chain text:** Fully decentralized fortune content  
✅ **Easy iteration:** Update text via contract calls  
✅ **No IPFS dependency:** Text stored on-chain  
✅ **Customizable styling:** Change font, colors, layout  
✅ **Lower maintenance:** No managing 90+ IPFS pins  
✅ **Future-proof:** Can add image variants later  

---

## Files Modified

### Smart Contracts
- ✅ `src/Fortune721.sol` - Refactored for text storage
- ✅ `test/Fortune.t.sol` - Updated tests

### Scripts
- ✅ `script/LoadTexts.s.sol` - NEW: Batch load CSV data

### Documentation
- ✅ `MEDIA_ASSETS.md` - Updated requirements (1-2 files)
- ✅ `TEXT_APPROACH.md` - This document
- ✅ `scratchpad.md` - Noted refactor

---

## Next Steps

1. ✅ **Contracts refactored** - Ready for deployment
2. ⏳ **Get designer assets:**
   - 1 background PNG (1000×1000px)
   - 1 font file (optional, WOFF2)
3. ⏳ **Deploy to Base Sepolia** (follow DEPLOYMENT.md)
4. ⏳ **Upload assets to IPFS**
5. ⏳ **Run LoadTexts.s.sol** to populate text data
6. ⏳ **Test end-to-end** fortune generation
7. ⏳ **Build frontend** (Phase 3+)

---

## CSV Data Source

All text loaded from `prophet.csv`:
- 15 cards (The End, Pain, The Future, Love, Death, Mistery, Change, Fate, Illusion, Power, The Unknown, Wisdom, Chaos, Silence, Hope)
- Each card has 6 text variants
- Can be edited and reloaded at any time

---

**Ready to deploy with new text-based approach!**