# Bezmiar Fortune Teller - Development Scratchpad

**Last Updated:** 2025-10-27  
**Current Phase:** Phase 3 Bug Fixes & Configuration  
**Status:** Addressing pricing, mint confirmation, event parsing, and preparing for text matrix

---

## 🔧 ACTIVE WORK SESSION - October 27, 2025

### ✅ COMPLETED WORK:
1. ✅ **Pricing Update**: Changed from 0.01 ETH → 0.03 ETH (deployed)
2. ✅ **Mint Confirmation**: Added comprehensive balance verification
3. ✅ **Event Parsing**: Implemented 3-tier fallback system
4. ⏳ **Text Matrix**: Ready for user to provide data

### Next: User Testing + Text Matrix Data

---

## Project Overview
Minimal Web3 NFT fortune teller: users get 3 ERC-1155 cards (burn-redeem or paid mint), then mint 1 ERC-721 fortune derived from those cards. Black/white UI, on-chain SVG, gas-efficient, secure.

---

## Development Phases

### PHASE 0: Project Setup & Architecture ✅ COMPLETE
**Objective:** Establish repo structure, tooling, initial configs

**Tasks:**
- [x] Initialize monorepo structure (apps/web, apps/contracts)
- [x] Set up Foundry project (forge init, remappings, foundry.toml)
- [x] Set up Next.js 15 App Router project with TypeScript
- [x] Configure base dependencies (OZ 5.x, wagmi v2, viem, Web3Modal v2)
- [x] Create initial ENV template files
- [x] Create FILETREE.md, README.md, SETUP.md
- [x] Define chain target (Base default), RPC configs (Alchemy/Infura)

**Executor Prompt:**
```
Initialize monorepo with:
- /apps/contracts: Foundry project (solc ^0.8.26, OpenZeppelin 5.x)
- /apps/web: Next.js 15 App Router, TypeScript, Tailwind
- Install: wagmi@^2, viem@^2, @web3modal/wagmi
- Create foundry.toml with Base config
- Create .env.example with all vars from section 7 of plan.md
- Generate initial FILETREE.md and SETUP.md
```

---

### PHASE 1: Core Smart Contracts
**Objective:** Implement Pack1155, BurnRedeemGateway, Fortune721 with tests

#### PHASE 1A: Pack1155 Contract ✅ COMPLETE
**Tasks:**
- [x] Implement Pack1155.sol (ERC1155, ERC2981, Ownable, Pausable, ReentrancyGuard)
  - [x] PACK_SIZE constant = 3
  - [x] mintPack(address to) payable - exactly 3 random IDs
  - [x] IRandomness interface integration
  - [x] maxSupply/totalMinted per ID with bounds checks
  - [x] pricePerPack, payout address, withdraw()
  - [x] PackMinted event with uint256[3]
- [x] Write Pack.t.sol tests
  - [x] testMintPackExactlyThree()
  - [x] testRandomnessBounds()
  - [x] testSupplyCaps()
  - [x] testReentrancyGuards()
  - [x] testPriceAndWithdraw()

**Executor Prompt:**
```
Implement Pack1155.sol following spec in plan.md section 4.1 and prompt 12A:
- Use OpenZeppelin 5.x imports
- Solidity ^0.8.26
- Constants: PACK_SIZE=3
- State: maxSupply/totalMinted mappings, pricePerPack, payout address
- IRandomness interface: function draw(bytes32 salt) external view returns (uint256)
- mintPack: nonReentrant, whenNotPaused, payable, emits PackMinted(to, uint256[3])
- Admin: setURI, setMaxSupply, setPrice, setRoyalty, pause/unpause, withdraw
- Include NatSpec comments
Write comprehensive Foundry tests in Pack.t.sol covering all invariants.
```

#### PHASE 1B: Burn Redeem System ✅ COMPLETE
**Tasks:**
- [x] Implement IBurnAdapter interface
- [x] Create adapters:
  - [x] DirectBurn721.sol
  - [x] DirectBurn1155.sol
  - [x] DeadTransfer721.sol
  - [x] DeadTransfer1155.sol
- [x] Implement BurnRedeemGateway.sol
  - [x] Adapter registry (collection → adapter)
  - [x] burnAndMintPack(collection, tokenId, amount)
  - [x] BurnedForPack event
- [x] Write Burn.t.sol tests
  - [x] testBurnRedeemAdapters() for each type
  - [x] testRevertOnUnknownAdapter()
  - [x] testReentrancyOnBurn()

**Executor Prompt:**
```
Implement burn redeem system per plan.md section 4.2-4.3:
1. Create IBurnAdapter interface with burnFor(address user, uint256 tokenId, uint256 amount)
2. Implement 4 adapter contracts in src/adapters/
3. Implement BurnRedeemGateway.sol:
   - mapping(address => IBurnAdapter) adapters
   - setAdapter(address collection, address adapter) onlyOwner
   - burnAndMintPack(collection, tokenId, amount): nonReentrant, whenNotPaused
   - Calls adapter.burnFor then pack1155.mintPack(msg.sender)
   - Events: BurnedForPack(user, collection, tokenId)
Write comprehensive tests in Burn.t.sol with mock ERC721/1155 contracts.
```

#### PHASE 1C: Fortune721 Contract ✅ COMPLETE
**Tasks:**
- [x] Implement Fortune721.sol (ERC721, ERC2981, Ownable)
  - [x] mintFromTriptych(uint256[3] ids, bytes proof)
  - [x] On-chain SVG tokenURI assembly
  - [x] Fragment storage and mapping (cardId/position/variant → CID)
  - [x] Background layer mapping
  - [x] PRNG variant selection (50/50 A or B)
  - [x] setPools, setGlobalSalt admin functions
- [x] Write Fortune.t.sol tests
  - [x] testMintFromTriptych()
  - [x] testTokenURIAssembly()
  - [x] testDeterministicMapping()
  - [x] testVariantSelection()

**Executor Prompt:**
```
Implement Fortune721.sol per plan.md section 4.4 and prompt 12C:
- ERC721, ERC2981, Ownable
- mintFromTriptych(uint256[3] calldata ids, bytes calldata proof)
  - Verify ownership/proof of 3 Pack1155 tokens
  - Generate deterministic tokenId from keccak256(ids, order, globalSalt)
- tokenURI returns base64-encoded JSON with embedded SVG:
  - Background layer from bgMapping[keccak256(ids)]
  - Text fragments A/B/C from textPools[ids[i]][position][variant]
  - Variant = uint256(keccak256(ids, tokenId, globalSalt)) % poolSize
- Admin functions: setPools, setBgMapping, setGlobalSalt, setRoyalty
- Events: FortuneMinted(user, tokenId, ids)
Write tests in Fortune.t.sol verifying deterministic output and SVG generation.
```

#### PHASE 1D: Randomness Coordinator ⏸️ SHELVED
**Status:** Deferred - Using MockRandomness for now
**Reason:** Can be added later if needed for mainnet
**Tasks (for later):**
- [ ] Decide on VRF vs Commit-Reveal (confirm with user)
- [ ] Implement chosen randomness module
- [ ] Integrate with Pack1155
- [ ] Test randomness distribution
**Note:** MockRandomness is sufficient for testnet deployment

**Executor Prompt (Commit-Reveal):**
```
Implement CommitRevealRandomness.sol:
- commit(bytes32 commitHash) stores keccak256(msg.sender, salt, nonce)
- reveal(bytes32 salt, uint256 nonce) verifies commit, combines with block.prevrandao
- draw(bytes32 seed) returns pseudo-random uint256
- Enforce reveal window (e.g., 256 blocks)
- Events: Committed(user, commitHash), Revealed(user, entropy)
Write tests verifying anti-gaming measures.
```

---

### PHASE 2: Smart Contract Deployment & Verification ✅ COMPLETE
**Objective:** Deploy contracts to testnet/mainnet, verify sources

**Tasks:**
- [x] Create Deploy.s.sol script
  - [x] Deploy Pack1155
  - [x] Deploy adapters
  - [x] Deploy BurnRedeemGateway with adapter links
  - [x] Deploy Fortune721
  - [x] Set roles, royalties, prices
  - [x] Configure randomness
- [ ] Deploy to Base testnet (Sepolia) ⏳ USER ACTION REQUIRED
- [ ] Verify all contracts on block explorer ⏳ USER ACTION REQUIRED
- [ ] Smoke test with test wallet ⏳ USER ACTION REQUIRED
- [ ] Document deployed addresses in README.md ⏳ USER ACTION REQUIRED

**Executor Prompt:**
```
Create script/Deploy.s.sol using Foundry scripting:
- Deploy Pack1155 with initial params (baseURI, pricePerPack, payout, royalty)
- Deploy all 4 burn adapters
- Deploy BurnRedeemGateway linking to Pack1155
- Set adapters for test collections (provide addresses)
- Deploy Fortune721 linking to Pack1155
- Set initial text pools for fortune (provide data structure)
- Output all deployed addresses
- Include verification commands
Run deployment on Base Sepolia and verify sources.
```

---

### PHASE 3: Frontend Foundation
**Objective:** Next.js app with wallet connection, basic UI layout

#### PHASE 3A: Project Setup & Config
**Tasks:**
- [ ] Set up Tailwind with minimal B/W theme tokens
- [ ] Configure wagmi with Base chain
- [ ] Set up Web3Modal v2 (NO API keys per user requirement)
- [ ] Create contract ABIs and addresses config
- [ ] Set up Zustand store for app state

**Executor Prompt:**
```
Set up Next.js 15 web app:
- Configure Tailwind with minimal B/W palette (blacks, whites, grays only)
- Create lib/wagmi.ts with wagmi config for Base chain
  - Use Alchemy as primary RPC (env: NEXT_PUBLIC_ALCHEMY_KEY)
  - Use Infura as fallback RPC (env: NEXT_PUBLIC_INFURA_KEY)
- Create lib/web3modal.ts with Web3Modal v2 config (NO projectId/API key)
- Create lib/contracts.ts exporting ABIs and addresses from env
- Create lib/store.ts with Zustand store:
  - walletState, triptychIds, fortuneTokenId, txStates
- Create minimal layout.tsx with font config
```

#### PHASE 3B: Core Components
**Tasks:**
- [ ] Create WalletButton component (connect/disconnect)
- [ ] Create CTAButton component (main action)
- [ ] Create ChoiceModal component (Burn | Mint buttons)
- [ ] Create MintLoader component (tx progress)
- [ ] Create Triptych component (3 card display)
- [ ] Create FortuneCard component (SVG display)
- [ ] Create MarketLinks component (OpenSea/MagicEden)
- [ ] Create RestartButton component

**Executor Prompt:**
```
Create components in components/ following minimal B/W design:
1. WalletButton.tsx - Web3Modal trigger, shows address when connected
2. CTAButton.tsx - Large centered "TELL ME MY FUTURE" button
3. ChoiceModal.tsx - Modal with "Burn to Redeem" | "Mint from Scratch"
4. MintLoader.tsx - Progress indicator (submitted → pending → confirmed)
5. Triptych.tsx - Grid of 3 card images with IDs
6. FortuneCard.tsx - Display fortune title + SVG + text
7. MarketLinks.tsx - OS/ME icon links using env URLs
8. RestartButton.tsx - "Start Over" resets state
Use Tailwind, minimal animations, mobile responsive.
```

---

### PHASE 4: Web3 Integration & Hooks
**Objective:** Connect frontend to smart contracts

**Tasks:**
- [ ] Create useEligibleBurns() hook (detect NFTs)
- [ ] Create useMintPack() hook (Pack1155.mintPack)
- [ ] Create useBurnAndMint() hook (BurnRedeemGateway)
- [ ] Create useMintFortune() hook (Fortune721.mintFromTriptych)
- [ ] Create useTxToasts() hook (notifications)
- [ ] Create useRandomness() hook (if commit-reveal)

**Executor Prompt:**
```
Create hooks in lib/hooks/:
1. useEligibleBurns.ts - queries wallet for supported NFTs, filters eligible tokens
2. useMintPack.ts - wraps Pack1155.mintPack with wagmi:
   - Accepts payment in wei from env
   - Returns tx status, receipt, emitted event ids
3. useBurnAndMint.ts - wraps BurnRedeemGateway.burnAndMintPack
4. useMintFortune.ts - wraps Fortune721.mintFromTriptych
   - Accepts uint256[3] ids, generates proof if needed
5. useTxToasts.ts - toast notifications for tx lifecycle
Use wagmi v2 hooks (useWriteContract, useWaitForTransactionReceipt, useReadContract).
```

---

### PHASE 5: Main User Flow
**Objective:** Complete end-to-end flow on main page

**Tasks:**
- [ ] Implement landing section (video bg, CTA)
- [ ] Implement choice flow (burn vs mint)
- [ ] Implement mint flow with loader
- [ ] Implement triptych display
- [ ] Implement fortune mint with result
- [ ] Add marketplace links
- [ ] Add restart functionality
- [ ] Mobile responsive polish

**Executor Prompt:**
```
Build app/page.tsx implementing full flow from plan.md section 2:
1. Landing: video bg (public/video/hero.mp4), logo TL, WalletButton TR, CTAButton center
2. On CTA click → ChoiceModal
3. Burn path: show eligible NFTs, select one, call useBurnAndMint
4. Mint path: call useMintPack with price from env
5. Show MintLoader during tx
6. On success: extract 3 ids from event, display Triptych
7. "WHAT DOES IT MEAN?" button → useMintFortune
8. Show FortuneCard with title "Your Future" + SVG + MarketLinks
9. RestartButton clears state
Use Zustand for state management, enforce one tx at a time.
```

---

### PHASE 6: Asset Management & IPFS Proxy
**Objective:** IPFS integration with obfuscation and proxy

**Tasks:**
- [ ] Upload 3 initial card images to IPFS with obfuscated structure
- [ ] Create /api/asset/[...path]/route.ts proxy
- [ ] Implement rate limiting on proxy
- [ ] Add cache headers
- [ ] Update Pack1155 baseURI to use proxy
- [ ] Test asset loading

**Executor Prompt:**
```
Create IPFS asset proxy system:
1. Upload card assets to IPFS with salted filenames (id_{N}_{hash}.json)
2. Implement app/api/asset/[...path]/route.ts:
   - Fetch from IPFS gateway (env: IPFS_GATEWAY_URL)
   - Add rate limiting (10 req/min per IP)
   - Cache headers (max-age=3600)
   - Return image with proper content-type
3. Update Pack1155 URI to: ${NEXT_PUBLIC_BASE_URL}/api/asset/{cid}/{filename}
4. Test loading in Triptych component
```

---

### PHASE 7: Testing & Security Audit
**Objective:** Comprehensive testing and security review

**Tasks:**
- [ ] Run full Foundry test suite (forge test -vvv)
- [ ] Run coverage report (forge coverage)
- [ ] Gas optimization pass
- [ ] Frontend E2E tests (basic flows)
- [ ] Security checklist review (section 10)
- [ ] External audit (optional, if budget allows)

**Executor Prompt:**
```
Execute testing and audit phase:
1. Run forge test --gas-report, identify optimization opportunities
2. Run forge coverage, ensure >90% coverage
3. Review security checklist from plan.md section 10:
   - Verify no tx.origin usage
   - Confirm nonReentrant on all external functions
   - Check arithmetic safety
   - Verify supply bounds
   - Confirm admin protections
4. Test frontend flows manually on testnet
5. Document findings in SECURITY.md
```

---

### PHASE 8: Documentation & Deployment Prep
**Objective:** Complete docs, prepare mainnet deployment

**Tasks:**
- [ ] Update README.md with full project overview
- [ ] Update SETUP.md with installation steps
- [ ] Update FILETREE.md with final structure
- [ ] Document ENV variables with examples
- [ ] Create deployment runbook
- [ ] Prepare mainnet deployment script
- [ ] Final UI polish and responsiveness check

**Executor Prompt:**
```
Finalize documentation:
1. README.md: overview, architecture, installation, usage, deployed addresses
2. SETUP.md: step-by-step initial setup (clone, install, env, deploy, run)
3. FILETREE.md: complete file tree with descriptions
4. ENV.md: all variables with descriptions and example values
5. DEPLOYMENT.md: mainnet deployment checklist and script usage
6. Verify all links, commands, and addresses
```

---

### PHASE 9: Mainnet Deployment & Launch
**Objective:** Deploy to Base mainnet, announce

**Tasks:**
- [ ] Final contract audit review
- [ ] Deploy to Base mainnet
- [ ] Verify contracts on BaseScan
- [ ] Test with real wallet on mainnet
- [ ] Set up monitoring (tx events, errors)
- [ ] Launch announcement materials
- [ ] Monitor initial usage

**Executor Prompt:**
```
Execute mainnet deployment:
1. Run Deploy.s.sol on Base mainnet
2. Verify all contracts on BaseScan
3. Update .env.production with mainnet addresses
4. Deploy frontend to production (Vercel recommended)
5. Test complete flow with small amount
6. Set up monitoring dashboard for events
7. Document deployed addresses in README.md
```

---

## Open Questions Tracker

From plan.md section 13 - **MUST RESOLVE BEFORE PHASE 1C**:

1. **Chain**: Base confirmed? Any other chains?
2. **Pricing**: What is pricePerPack in wei? Royalty bps?
3. **Supply**: How many distinct card IDs? Caps per ID? Total expected mints?
4. **Burn Sources**: Which external collection addresses are eligible? Provide addresses + adapter types
5. **Randomness Mode**: VRF or Commit-Reveal? (affects Phase 1D)
6. **Fortune Text Pools**: 
   - How many text fragments per position (A/B/C)?
   - How many variants per fragment?
   - Content provided by client?
7. **Obfuscation Level**: On-chain SVG for fortune confirmed? Card encryption needed?
8. **Branding**: Logo SVG, favicon, hero video asset needed before Phase 3
9. **OpenGraph**: Render per-fortune OG images for shares?
10. **Limits**: Per-wallet caps? Time windows? Team mint allocation?

---

## Progress Tracking

- [x] Phase 0 Complete - Project Setup ✅
- [x] Phase 1A Complete - Pack1155 ✅
- [x] Phase 1B Complete - Burn System ✅
- [x] Phase 1C Complete - Fortune721 ✅
- [~] Phase 1D Shelved (Randomness - using MockRandomness)
- [x] Phase 2 Complete - Deployment Scripts ✅
- [x] Phase 3 Complete - Frontend (Setup + Components + Hooks + Flow) ✅
- [ ] Phase 6 Complete (Assets)
- [ ] Phase 7 Complete (Testing)
- [ ] Phase 8 Complete (Docs)
- [ ] Phase 9 Complete (Launch)

---

## Notes & Blockers

**Phase 0 Complete (2025-10-15)**
- All configuration files created
- Monorepo structure defined
- Wallet connection using native wagmi connectors (no API keys)
- Ready for smart contract development

**Phase 3 Complete (2025-10-15)**
- ✅ Frontend infrastructure complete
- ✅ All components created (8 components)
- ✅ Core hooks implemented (useMintPack, useMintFortune)
- ✅ Full user flow integrated
- ✅ State management with Zustand
- ✅ Contract ABIs and addresses configured
- **Files created**: 14 new frontend files
- **Ready for**: Contract deployment + asset integration

*No current blockers*

---

## Next Action

**COMPLETED:** 
- ✅ Phase 0 - All configuration files
- ✅ Phase 1A - Pack1155 contract with tests
- ✅ Phase 1B - Burn redeem system with 4 adapters
- ✅ Phase 1C - Fortune721 **REFACTORED** for text-based approach
- ✅ Phase 2 - Deployment scripts and guide

**MAJOR REFACTOR COMPLETE:**
- Changed from 91 PNG fragments to on-chain text + 1 background
- prophet.csv data ready to load
- LoadTexts.s.sol script created for batch loading
- **SWITCHED TO ETHEREUM MAINNET** (from Base)
  - All configs updated for Ethereum/Sepolia
  - RPC endpoints changed to eth-mainnet/sepolia
  - Etherscan verification (not BaseScan)
  - Chain IDs: 1 (mainnet), 11155111 (sepolia)
  - Updated: .env.example, foundry.toml, Deploy.s.sol, wagmi.ts, all docs

**FILES CREATED/UPDATED:**
- src/Fortune721.sol (refactored: fragmentCIDs → fragmentTexts)
- script/LoadTexts.s.sol (NEW: loads all CSV data)
- test/Fortune.t.sol (updated for text approach)
- MEDIA_ASSETS.md (updated: 1-2 files instead of 91)
- TEXT_APPROACH.md (NEW: comprehensive refactor documentation)

**SIMPLIFIED ASSET REQUIREMENTS:**
1. fortune-background.png (1000×1000px) - REQUIRED
2. fortune-font.woff2 - OPTIONAL

**DEPLOYMENT WORKFLOW (Updated):**
1. Deploy contracts (Deploy.s.sol)
2. Upload background + font to IPFS
3. Set background CID in Fortune721
4. Run LoadTexts.s.sol to populate text data
5. Test fortune generation

**AWAITING:** 
- User to get 1 background PNG from designer
- Optional: custom font file
- Then deploy to Base Sepolia following DEPLOYMENT.md
- OR proceed to Phase 3 (Frontend) while assets are prepared

---

## 📋 DETAILED ACTION PLAN - October 27, 2025

### STEP 1: Update Pricing (0.01 ETH → 0.03 ETH)
**Objective:** Change mint price for non-holders to 0.03 ETH

**Files to Modify:**
1. `apps/contracts/script/Deploy.s.sol` - Line 100 (deployment default)
2. `apps/web/lib/contracts.ts` - Line 105-107 (frontend fallback)
3. `.env.example` (documentation)

**Changes Required:**
- Deploy.s.sol: `pricePerPack = vm.envOr("PRICE_PER_PACK_WEI", uint256(0.03 ether));`
- contracts.ts: `process.env.NEXT_PUBLIC_PRICE_PER_PACK_WEI || '30000000000000000'`
- Update env example to show 30000000000000000 as default

**Deployment Strategy:**
- Since user burned their Promise NFT, need fresh Anvil deployment
- Auto-deploy script: `script/Deploy.s.sol`
- Command: `forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast`
- Need to ensure Anvil is running first
- Will generate new contract addresses

**Notes:**
- Burn redemption remains FREE (0 wei) via BurnRedeemGateway
- Price only affects `Pack1155.mintPack()` direct minting

---

### STEP 2: Fix Mint Confirmation & Balance Issues
**Objective:** Ensure reliable card minting and balance verification

**Issues Identified:**
1. User sees 3 cards displayed after mint
2. BUT checking balances via cast returns 0x0 (zero)
3. Need better confirmation mechanism

**Investigation Required:**
- Check if `_mintBatch` is actually executing in Pack1155.sol (line 130)
- Verify `totalMinted` counter is incrementing
- Confirm ERC1155 Transfer events are being emitted
- Test balance queries immediately after mint

**Enhancements:**
1. **Contract Level (Pack1155.sol):**
   - Add explicit TransferBatch event verification in tests
   - Add balance check in test suite after mintPack

2. **Frontend Level (useMintPack.ts):**
   - Add post-confirmation balance check for all 3 card IDs
   - Display balance verification in UI
   - Add retry mechanism for balance queries
   - Better error messages when balances don't match

3. **CLI Testing Script:**
   - Create simple script to mint + immediately check balances
   - Use for rapid debugging on Anvil

**Files to Modify:**
- `apps/web/lib/hooks/useMintPack.ts` - Add balance verification
- `apps/contracts/test/Pack.t.sol` - Add balance assertions
- Create: `apps/contracts/script/TestMint.s.sol` - Debug script

---

### STEP 3: Fix PackMinted Event Parsing
**Objective:** Eliminate "PackMinted event not found in logs" error permanently

**Root Causes Identified:**
1. Address comparison may have case-sensitivity issues
2. Event signature might not match exactly
3. Log filtering might be too restrictive
4. Contract address from env might be stale after redeployment

**Comprehensive Fix Plan:**

**A. Contract Side (Verification):**
- Ensure Pack1155.sol emits PackMinted event correctly (line 132)
- Verify event signature matches ABI exactly
- Add event to test assertions

**B. Frontend Side (useMintPack.ts):**
1. **Normalize addresses:** Use `.toLowerCase()` consistently
2. **Verbose logging:** Log ALL receipt logs, not just filtered ones
3. **Multiple event formats:** Try both indexed and non-indexed parsing
4. **Fallback mechanism:** If event not found, query balances directly
5. **Address validation:** Check PACK1155_ADDRESS on hook initialization

**Files to Modify:**
- `apps/web/lib/hooks/useMintPack.ts`:
  - Lines 55-90: Rewrite event parsing logic
  - Add defensive checks
  - Add balance-based fallback
  
- `apps/web/lib/contracts.ts`:
  - Add runtime validation of addresses
  - Log warning if addresses are empty

**C. Enhanced Error Handling:**
```typescript
// Pseudocode for robust event parsing
if (PackMinted event found) {
  → Use event data
} else if (TransferBatch event found) {
  → Extract IDs from TransferBatch
} else {
  → Query balanceOf for all 15 card IDs
  → Return IDs where balance > 0
}
```

**D. Environment Configuration:**
- Add validation that contract addresses are set
- Show clear error in UI if addresses missing
- Add development mode with mock addresses

---

### STEP 4: Text Matrix Data Loading (READY FOR USER INPUT)
**Objective:** Prepare system to receive and load 90 text fragments

**Requirements:**
- 15 card IDs (0-14)
- 3 positions (1, 2, 3)
- 2 variants per position (A=0, B=1)
- Total: 15 × 3 × 2 = 90 unique text strings

**Existing Infrastructure:**
- ✅ Fortune721.sol has `setFragmentText()` function (line 248-259)
- ✅ Fortune721.sol has `setFragmentTextBatch()` function (line 268-288)
- ✅ Storage mapping: `fragmentTexts[cardId][position][variant]`

**Preparation Needed:**
1. **Data Format Decision:**
   - Option A: CSV file (cardId, position, variant, text)
   - Option B: JSON structure
   - Option C: Solidity array literals

2. **Loading Script:**
   - Use existing `script/LoadTexts.s.sol` (referenced in scratchpad line 475)
   - Or create new batch loading script
   - Need to handle gas limits (batch in groups of 10-20)

3. **Validation:**
   - Check all 90 entries are loaded
   - Query random samples
   - Test fortune generation with various combinations

**User Action Required:**
- Provide text matrix in agreed format
- We'll convert to appropriate batch loading calls

**Script to Create:**
`apps/contracts/script/LoadTextMatrix.s.sol`:
- Read from CSV/JSON
- Batch call `setFragmentTextBatch()`
- Verify all loaded correctly

---

### EXECUTION ORDER:

1. **STEP 1** (Pricing) - 15 minutes
   - Update 3 files
   - Redeploy contracts to Anvil
   - Update frontend env
   - Test mint with new price

2. **STEP 2** (Mint Confirmation) - 45 minutes
   - Add balance verification to frontend
   - Enhance tests
   - Create debug script
   - Test on Anvil with verbose logging

3. **STEP 3** (Event Parsing) - 45 minutes
   - Rewrite event parsing logic
   - Add multiple fallbacks
   - Add address validation
   - Test with fresh deployment

4. **STEP 4** (Text Matrix) - User provides data first
   - Then create loading script (30 minutes)
   - Load data to contract (15 minutes)
   - Verify and test fortune generation (30 minutes)

**Total Estimated Time:** ~3 hours (excluding Step 4 data preparation)

---

## 🔄 Re-deployment Information

**Why Re-deploy?**
- User burned their "A Promise" NFT during testing
- Need fresh contracts with fresh state
- New addresses will be generated

**Auto-Deployment Script:**
- Location: `apps/contracts/script/Deploy.s.sol`
- Deploy command (Anvil):
  ```bash
  cd apps/contracts
  forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
  ```

**Post-Deployment Steps:**
1. Extract addresses from `broadcast/Deploy.s.sol/1337/run-latest.json`
2. Update `apps/web/.env.local` with new addresses:
   - NEXT_PUBLIC_PACK1155
   - NEXT_PUBLIC_BURN_GATEWAY
   - NEXT_PUBLIC_FORTUNE721
3. Restart Next.js dev server
4. Test mint flow

**Address Locations in Broadcast JSON:**
- MockRandomness: `transactions[0].contractAddress`
- Pack1155: `transactions[1].contractAddress`
- BurnRedeemGateway: `transactions[3].contractAddress`
- Fortune721: `transactions[4].contractAddress`

---

## ✅ READY TO PROCEED

**Status:** Planner mode complete - awaiting user approval

**Next Command:** User says "invoke executor mode" to begin Step 1