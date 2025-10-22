# Bezmiar Fortune Teller — PLAN.md

> A concise, end‑to‑end blueprint to scaffold and ship a minimal, secure Web3 NFT experience. Written as a build manual + prompt pack.

---

## 0) Project Goals
- **Core**: Mystic one‑click flow that yields **3 ERC‑1155 “cards”** (by burn‑redeem *or* paid mint), then mints a **4th ERC‑721 “fortune”** derived from the first three.
- **Tone**: Ultra‑minimal, black‑and‑white UI; fast, responsive, gas‑efficient; simple enough to audit.
- **Security**: No reentrancy, no unbounded loops, provable randomness or commit‑reveal, allowlist‑style burn adapters.
- **Maintainability**: Clear envs, modular contracts, typed frontend (TS), repeatable CI/CD.

---

## 1) Architecture at a Glance

### Smart Contracts (Solidity + Foundry)
1. **Pack1155** (ERC‑1155):
   - Holds the **card editions** (finite or elastic supply per id).
   - **MintPack(3)** endpoint that mints exactly 3 random ids to the buyer.
   - Supply controls (caps), royalty (ERC2981), pausability.
2. **BurnRedeemGateway**:
   - Verifies/burns approved external NFTs (ERC‑721/1155 **Burnable** or via adapter) and calls `Pack1155.mintPack` for 3 cards.
   - Pluggable **BurnAdapter** per external collection (supports: direct burn, transfer‑to‑dead, escrow‑then‑burn if needed).
3. **Fortune721** (ERC‑721):
   - Mints a **single “fortune” token** based on the 3 card ids/order.
   - On‑chain tokenURI assembler for text/SVG (prevents asset scraping), or points to obfuscated IPFS JSON.
4. **RandomnessCoordinator** (optional module):
   - **Option A (Chainlink VRF)**: request/fulfill; seeds `Pack1155` draws.
   - **Option B (Commit‑Reveal)**: user provides commit (salted), later reveals; combines with blockhash.
5. **AccessControl**: Owner + roles (DEFAULT_ADMIN, MINTER, PAUSER, URI_SETTER).

> Contracts are split so we can upgrade/replace **Burn adapters** or **Randomness** without touching core token storage.

### Frontend (Next.js 15 + App Router, TS)
- **wagmi v2 + viem**, **Web3Modal v2** for wallet connect.
- Single‑page flow with sections and modals (CTA → Choose flow → Mint loader → Triptych → Fortune mint → Share/links → Restart).
- State via **Zustand** or MobX (user preference available) for lightweight global state.
- Serverless actions for signature helpers (if needed), analytics, and obfuscated asset proxy (optional).

### Storage / Assets
- **3 initial cards**: images on IPFS with **folder‑level obfuscation** + delayed reveal (hash‑listed but non‑trivial path). Optional **encryption at rest** + **gateway proxy** to deter scraping.
- **4th fortune**: Prefer **on‑chain text/SVG**; zero asset leakage.

---

## 2) User Flow (Spec)
1. **Landing**: B/W page, logo (TL), connect (TR), full‑screen compressed video (5–8MB), tagline, one‑liner, CTA: **TELL ME MY FUTURE**.
2. **CTA click** → **two buttons**: `Burn to Redeem` | `Mint from Scratch`.
3. **Burn to Redeem**:
   - Detect supported NFT(s) in wallet; show selectable eligible tokens.
   - User picks one; tx calls **BurnRedeemGateway.burnAndMintPack** → emits **3 cards**.
4. **Mint from Scratch**:
   - One tx: **Pack1155.mintPack(3)**; price set via contract; 1 pack per tx enforced.
5. **Loader** with progress events (submitted → pending → confirmed).
6. **Success**: show triptych (3 card images/ids) + button **WHAT DOES IT MEAN?! (Do a reading)**.
7. Click → **Fortune mint** (single tx): **Fortune721.mintFromTriptych(cardIds, orderProof)**.
8. **Result**: Title **Your Future** + the 4th card (text/SVG) + links to **OpenSea | MagicEden** + **Start Over**.

Constraints:
- **Exactly 3** cards per pack, never less; **no batching**; **one pack per transaction** (enforced onchain).
- Fortune combines **4 layers**: Background + sentence parts **(A,B,C)** derived from positions **(1,2,3)**.
- Each arrangement may map to **2–3 text variants**.

---

## 3) Randomness & Anti‑Gaming
- **Option A: Chainlink VRF** (most trust‑minimized; needs LINK & callback gas config).
- **Option B: Commit‑Reveal**: user commits `keccak256(msg.sender, salt, nonce)`; reveal next tx; combine with `block.prevrandao` & rolling server salt; enforce reveal window to prevent griefing.
- **Shuffle algorithm**: Fisher‑Yates on small id pool or modulo mapping with **rejection sampling** to avoid bias.
- **Per‑tx guarantees**: `nonReentrant`, `tx.origin` **not** used; `msg.sender` only.
- **One pack per tx**: hard‑coded constant `PACK_SIZE = 3`; public mint reverts if `count != 3`.
- **Rate limit**: Optional per‑block mint guard (mapping of `minter->lastBlock`) to avoid MEV multi‑mints; configurable.

---

## 4) Contract Specs (ABIs & Behavior)

### 4.1 Pack1155 (ERC1155, ERC2981, Ownable, Pausable, ReentrancyGuard)
- **State**
  - `uint256 constant PACK_SIZE = 3`.
  - `mapping(uint256 => uint256) maxSupply; mapping(uint256 => uint256) totalMinted;`
  - `Price pricePerPack` (in wei), `address payout`
  - `IRandomness rand`, `uint256 entropyEpoch` (rotate seed)
- **Admin**
  - `setURI(base)`, `setMaxSupply(id,cap)`, `setPrice(wei)`, `setRoyalty(receiver,bps)`, `pause/unpause()`
- **User**
  - `mintPack(address to)` payable → mints exactly **3** random ids; emits `PackMinted(to, ids[3])`.
- **Security**
  - Reentrancy guard, bounds checks on supply, no unbounded loops (sample up to small K with rejections).

### 4.2 BurnRedeemGateway
- **Config**: list of **BurnAdapter**s keyed by external collection address.
- **Flow**: `burnAndMintPack(extNft, tokenIdOrId, amount)` → adapter burns/escrows → calls `Pack1155.mintPack(to)`.
- Reverts if adapter not set, token ineligible, or batch attempt.

### 4.3 BurnAdapter(s)
- **DirectBurn721/1155**: requires approval; calls `burn` on external.
- **DeadTransfer721/1155**: transfers to `0x000…dEaD` when project policy allows.
- **EscrowThenBurn**: holds token then burns via project’s hook if available.

### 4.4 Fortune721 (ERC721, ERC2981)
- **Determinism**: `tokenId` seeds from `(triptychIds, order)` + global salt.
- **Mint**: `mintFromTriptych(uint256[3] ids, bytes proof)` → verifies caller owns those 3 fresh mints (or provides ownership proof).
- **TokenURI**:
  - **Preferred**: On‑chain **SVG + JSON** that renders 4 layers: BG + text(A,B,C).
  - Fallback: IPFS JSON with obfuscated paths; metadata includes `components: [idA,idB,idC,order,variant]`.
- **Mapping**: `(idA,pos1) -> textPoolA[]`, `(idB,pos2) -> textPoolB[]`, `(idC,pos3) -> textPoolC[]`; variant chosen via PRNG.

---

## 5) Asset Strategy & Obfuscation
- **Initial 3 cards**: IPFS **directory CID not publicly linked**; filenames salted (e.g., `id_17__a9f0e61.json`).
- **Gateway proxy**: Frontend fetches via our Next.js API route `/api/asset/[cid]/[file]` → server fetches from IPFS → adds cache headers → **rate limits**.
- **Delayed reveal**: store **`sha256` of JSON** onchain; reveal flips to real URIs later.
- **Optional encryption**: AES‑GCM for images; decryption key derived client‑side post‑mint (tradeoff: UX complexity vs scraping resistance).
- **Fortune**: on‑chain SVG => no IPFS exposure.

---

## 6) Frontend Plan (Next.js 15, TS)
- **Stack**: Next.js App Router, wagmi v2 + viem, Web3Modal v2, Zustand/MobX, Tailwind (minimal tokens), Framer Motion (light).
- **Pages/Routes**
  - `/` landing (video bg, CTA)
  - `/api/asset/*` IPFS proxy
- **Components**
  - `WalletButton`, `CTA`, `ChoiceButtons`, `MintLoader`, `Triptych`, `FortuneCard`, `MarketLinks`, `Restart`
- **Hooks**
  - `useEligibleBurns()`, `useMintPack()`, `useMintFortune()`, `useTxToasts()`, `useRandomness()`
- **UX Details**
  - **Loader** reflects `txHash → receipt` with optimistic UI.
  - **One pack per tx** enforced in UI; block repeat click until confirmation.
  - Social links (OS/ME/X) as icons in footer.

---

## 7) Config & ENV
```
# Contracts
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_PACK1155=
NEXT_PUBLIC_BURN_GATEWAY=
NEXT_PUBLIC_FORTUNE721=
# Pricing / URLs
NEXT_PUBLIC_PRICE_PER_PACK_WEI=
NEXT_PUBLIC_OPENSEA_COLLECTION=
NEXT_PUBLIC_MAGICEDEN_COLLECTION=
# IPFS
IPFS_GATEWAY_URL=
OBFUSCATED_ROOT_CID=
# Randomness
RANDOMNESS_MODE=vrf|commit
VRF_COORDINATOR=
VRF_KEY_HASH=
VRF_SUBSCRIPTION_ID=
```

---

## 8) Test Plan (Foundry)
- **Unit**
  - `testMintPackExactlyThree()` → always 3.
  - `testRandomnessBounds()` → ids ∈ allowed set, no bias under N trials.
  - `testSupplyCaps()` → reverts over cap.
  - `testBurnRedeemAdapters()` → 721 + 1155 paths, revert on unknown adapter.
  - `testReentrancyGuards()` → forge‑invariant with handlers.
  - `testFortuneFromTriptych()` → mapping → tokenURI contains 3 parts.
- **Property**
  - Invariant: no unbounded growth of state arrays; no mint over caps; no admin‑only leakage.
- **Fuzz**
  - Random id distributions; reveal windows.

---

## 9) Deployment & Ops
- **Chains**: default **Base** (configurable). Gas‑efficient.
- **Scripts**: Foundry `script/Deploy.s.sol` → deploy Pack1155 → BurnGateway (with adapters) → Fortune721 → set roles → set royalty → set VRF/commit mode.
- **Verify**: Sourcify + block explorer verification.
- **Post‑deploy**: Set IPFS base URI (obfuscated), upload text pools for fortune, smoke test with test wallet.

---

## 10) Security Checklist
- [ ] No `tx.origin` usage
- [ ] `nonReentrant` on external minting endpoints
- [ ] Checked arithmetic (>=0.8.20)
- [ ] Bounds checks on supplies and ids
- [ ] Admin protected with **2‑of‑3 multisig**; timelock for parameter changes optional
- [ ] Pausable circuit breaker
- [ ] Events for all state changes
- [ ] External calls minimized; adapters isolated
- [ ] Randomness not miner‑influenced (VRF or commit‑reveal)
- [ ] No user‑controlled URIs without hashing/reveal

---

## 11) File Tree (target)
```
apps/
  web/
    app/
      page.tsx
      api/asset/[...path]/route.ts
    components/
    lib/wagmi.ts
    lib/contracts.ts
    styles/
    public/video/hero.mp4
  contracts/
    src/
      Pack1155.sol
      BurnRedeemGateway.sol
      adapters/
        DirectBurn721.sol
        DirectBurn1155.sol
        DeadTransfer721.sol
        DeadTransfer1155.sol
      Fortune721.sol
      RandomnessCoordinator.sol (optional)
    script/
      Deploy.s.sol
    test/
      Pack.t.sol
      Burn.t.sol
      Fortune.t.sol
```

---

## 12) Prompts for Build‑Mode (copy/paste into GPT)

### A) Generate Pack1155 (ERC‑1155) with exact‑3 pack mint
```
You are a senior Solidity engineer. Write Pack1155.sol using OpenZeppelin 5.x (solc ^0.8.26):
- ERC1155, ERC2981, Ownable, Pausable, ReentrancyGuard.
- Constant PACK_SIZE=3; public mint `mintPack(address to)` payable; mints exactly 3 random ids.
- pluggable randomness: interface IRandomness { function draw(bytes32 salt) external view returns (uint256); }
- enforce per‑id maxSupply; store totalMinted; revert on exhaustion.
- pricePerPack in wei; withdraw() to payout address.
- events: PackMinted(address indexed to, uint256[3] ids).
- gas‑safe loops (K≤8), bound checks, comments, NatSpec, OZ modifiers.
- no assembly unless needed. Include minimal tests in comments.
```

### B) BurnRedeemGateway + adapters
```
Write BurnRedeemGateway.sol:
- map collection→adapter; onlyOwner setAdapter.
- burnAndMintPack(collection, tokenId, amount): calls adapter.burnFor(msg.sender,…), then Pack1155.mintPack(msg.sender).
- 721 + 1155 adapters in adapters/ that support direct burn or dead‑transfer.
- events: BurnedForPack(user, collection, tokenIdOrId).
- reentrancy guard; pauseable.
```

### C) Fortune721 on‑chain SVG
```
Write Fortune721.sol (ERC721, ERC2981, Ownable):
- mintFromTriptych(uint256[3] ids, bytes proof) external; verifies caller owns the 3 latest Pack1155 mints or provides signed proof from backend keyed to tx hash.
- tokenURI assembles JSON+SVG on‑chain:
  - Background layer from mapping by (ids hash).
  - Three text fragments A/B/C selected from pools by (id,position,variant).
  - Variant picked via PRNG(seed=keccak256(ids, tokenId, globalSalt)).
- setPools admin; setGlobalSalt; setRoyalty.
- events for minted fortune.
```

### D) Next.js page + wagmi hooks
```
Build a Next.js 15 App Router page:
- B/W minimal styles; video bg (5–8MB). Top‑left logo, top‑right Wallet button (Web3Modal).
- Center CTA → Choice modal (Burn | Mint).
- `useMintPack()` hook: calls mintPack with correct value, handles receipts, returns the 3 ids.
- Then show Triptych, and a button that calls `useMintFortune(ids)`.
- Add OS/ME links by constructing token/collection URLs from envs.
- Add `/api/asset/[...path]` route that proxies to IPFS gateway with rate limiting.
```

---

## 13) Open Questions (for the team)
1. **Chain**: Base / Ethereum / Polygon / other? Any marketplace preference per chain?
2. **Pricing**: What is `pricePerPack` and royalty bps? Free mint?
3. **Supply**: How many distinct card ids? Caps per id? Total expected mints?
4. **Burn Sources**: Which external collections/ids are eligible? (provide addresses)
5. **Randomness Mode**: VRF (cost) vs Commit‑Reveal (UX). Preference?
6. **Fortune Text Pools**: Who authors the A/B/C fragments? How many per id/position? Any profanity filter/rules?
7. **Obfuscation Level**: Is on‑chain SVG for fortune acceptable? For the first 3 cards, do we require encryption or is delayed reveal enough?
8. **Branding**: Provide final logo SVG, favicon, and the background video asset.
9. **Shareability**: Do we render OpenGraph images per fortune for social shares?
10. **Allowlist / Limits**: Any per‑wallet cap or time windows? Team mint?

---

## 14) Milestones & Estimates (dev‑focused)
- **M1**: Contracts skeleton + Foundry tests green
- **M2**: Frontend scaffold + wallet, CTA flow, loaders
- **M3**: Pack mint end‑to‑end (scratch + burn)
- **M4**: Fortune mint + on‑chain SVG text pools
- **M5**: Asset obfuscation + proxy + reveal
- **M6**: Final polish, audit pass, mainnet deploy

---

## 15) Acceptance Criteria
- One tx → exactly 3 ERC‑1155 mints; no batching.
- Burn path works for at least 1 ERC‑721 and 1 ERC‑1155 external collection.
- Fortune mint derives from the exact ids + order; tokenURI displays all 4 layers.
- UI is monochrome minimal, responsive, <2s TTI on desktop, <3.5s mobile on 4G.
- All envs and scripts documented; tests cover core invariants.

---

**End of PLAN.md**

