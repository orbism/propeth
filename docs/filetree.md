# Bezmiar Fortune Teller - File Tree

```
bezmiar-fortune-teller/
├── apps/
│   ├── contracts/                    # Foundry Solidity project
│   │   ├── src/
│   │   │   ├── Pack1155.sol         # ERC1155 pack minting contract
│   │   │   ├── BurnRedeemGateway.sol # Burn-to-mint gateway
│   │   │   ├── Fortune721.sol       # ERC721 fortune NFT
│   │   │   ├── RandomnessCoordinator.sol # Optional VRF/commit-reveal
│   │   │   ├── interfaces/
│   │   │   │   ├── IRandomness.sol  # Randomness interface
│   │   │   │   └── IBurnAdapter.sol # Burn adapter interface
│   │   │   ├── mocks/
│   │   │   │   ├── MockRandomness.sol # Mock randomness for testing
│   │   │   │   ├── MockERC721.sol   # Mock ERC721 for testing
│   │   │   │   └── MockERC1155.sol  # Mock ERC1155 for testing
│   │   │   └── adapters/
│   │   │       ├── DirectBurn721.sol
│   │   │       ├── DirectBurn1155.sol
│   │   │       ├── DeadTransfer721.sol
│   │   │       └── DeadTransfer1155.sol
│   │   ├── script/
│   │   │   ├── Deploy.s.sol         # Deployment script
│   │   │   └── LoadTexts.s.sol      # Load CSV text data into Fortune721
│   │   ├── test/
│   │   │   ├── Pack.t.sol           # Pack1155 tests (20+ tests)
│   │   │   ├── Burn.t.sol           # BurnRedeemGateway tests (25+ tests)
│   │   │   └── Fortune.t.sol        # Fortune721 tests (30+ tests)
│   │   ├── script/
│   │   │   └── Deploy.s.sol         # Deployment script
│   │   ├── foundry.toml             # Foundry config
│   │   ├── remappings.txt           # Import remappings
│   │   ├── .env.example             # Contract env template
│   │   └── deployments/             # Deployed contract addresses
│   │       ├── mainnet.json
│   │       └── sepolia.json
│   │
│   └── web/                          # Next.js 15 App Router
│       ├── app/
│       │   ├── layout.tsx           # Root layout
│       │   ├── page.tsx             # Main fortune teller flow
│       │   ├── globals.css          # Tailwind + global styles
│       │   └── api/
│       │       └── asset/
│       │           └── [...path]/
│       │               └── route.ts # IPFS proxy endpoint
│       ├── components/
│       │   ├── WalletButton.tsx     # Web3Modal connect button
│       │   ├── CTAButton.tsx        # Main call-to-action
│       │   ├── ChoiceModal.tsx      # Burn vs Mint modal
│       │   ├── MintLoader.tsx       # Transaction progress
│       │   ├── Triptych.tsx         # 3-card display
│       │   ├── FortuneCard.tsx      # Fortune NFT display
│       │   ├── MarketLinks.tsx      # OpenSea/MagicEden links
│       │   └── RestartButton.tsx    # Reset flow button
│       ├── lib/
│       │   ├── wagmi.ts             # Wagmi configuration
│       │   ├── providers.tsx        # Wagmi + React Query providers
│       │   ├── contracts.ts         # Contract ABIs & addresses
│       │   ├── store.ts             # Zustand state management
│       │   └── hooks/
│       │       ├── useEligibleBurns.ts
│       │       ├── useMintPack.ts
│       │       ├── useBurnAndMint.ts
│       │       ├── useMintFortune.ts
│       │       └── useTxToasts.ts
│       ├── public/
│       │   ├── video/
│       │   │   └── hero.mp4         # Background video
│       │   └── images/
│       │       ├── logo.svg
│       │       └── favicon.ico
│       ├── styles/
│       │   └── tailwind.config.ts   # Tailwind theme
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       └── .env.example             # Frontend env template
│
├── docs/
│   ├── README.md                    # Project overview
│   ├── SETUP.md                     # Initial setup guide
│   ├── DEPLOYMENT.md                # Deployment walkthrough
│   ├── MEDIA_ASSETS.md              # Asset checklist for designer
│   ├── plan.md                      # Master plan (existing)
│   ├── scratchpad.md                # Development tracker
│   ├── FILETREE.md                  # This file
│   └── SECURITY.md                  # Security audit results
│
├── .gitignore
└── package.json                     # Root workspace config (optional)
```

## Description by Section

### `/apps/contracts`
Foundry-based Solidity contracts with OpenZeppelin 5.x dependencies. Includes comprehensive test suite and deployment scripts.

### `/apps/web`
Next.js 15 App Router frontend with TypeScript, Tailwind CSS, wagmi v2, and Web3Modal v2. Minimal black-and-white design.

### `/docs`
Project documentation including setup guides, plan, and security notes.

**Last Updated:** Phase 0 - Initial Setup