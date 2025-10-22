#!/bin/bash

# Bezmiar Fortune Teller - Directory and File Structure Setup Script
# This script creates the project structure as outlined in docs/filetree.md

set -e  # Exit on error

echo "=== Bezmiar Fortune Teller Structure Setup ==="
echo ""

# Step 1: Check current directory
echo "Current directory: $(pwd)"
echo ""

# Step 2: Navigate to bezmiar-fortune-teller directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Working in: $(pwd)"
echo ""

# Function to create file only if it doesn't exist
create_file_if_not_exists() {
    local filepath="$1"
    if [ -f "$filepath" ]; then
        echo "  ✓ Already exists: $filepath"
    else
        touch "$filepath"
        echo "  + Created: $filepath"
    fi
}

# Function to create directory
create_directory() {
    local dirpath="$1"
    if [ -d "$dirpath" ]; then
        echo "  ✓ Directory exists: $dirpath"
    else
        mkdir -p "$dirpath"
        echo "  + Created directory: $dirpath"
    fi
}

echo "Creating directory structure..."
echo ""

# === CONTRACTS STRUCTURE ===
echo "📁 Setting up apps/contracts..."

# Source directories
create_directory "apps/contracts/src/interfaces"
create_directory "apps/contracts/src/adapters"

# Source files
create_file_if_not_exists "apps/contracts/src/Pack1155.sol"
create_file_if_not_exists "apps/contracts/src/BurnRedeemGateway.sol"
create_file_if_not_exists "apps/contracts/src/Fortune721.sol"
create_file_if_not_exists "apps/contracts/src/RandomnessCoordinator.sol"
create_file_if_not_exists "apps/contracts/src/interfaces/IRandomness.sol"
create_file_if_not_exists "apps/contracts/src/interfaces/IBurnAdapter.sol"
create_file_if_not_exists "apps/contracts/src/adapters/DirectBurn721.sol"
create_file_if_not_exists "apps/contracts/src/adapters/DirectBurn1155.sol"
create_file_if_not_exists "apps/contracts/src/adapters/DeadTransfer721.sol"
create_file_if_not_exists "apps/contracts/src/adapters/DeadTransfer1155.sol"

# Test directories
create_directory "apps/contracts/test/mocks"

# Test files
create_file_if_not_exists "apps/contracts/test/Pack.t.sol"
create_file_if_not_exists "apps/contracts/test/Burn.t.sol"
create_file_if_not_exists "apps/contracts/test/Fortune.t.sol"

# Script directory
create_directory "apps/contracts/script"
create_file_if_not_exists "apps/contracts/script/Deploy.s.sol"

# Config files
create_file_if_not_exists "apps/contracts/foundry.toml"
create_file_if_not_exists "apps/contracts/remappings.txt"
create_file_if_not_exists "apps/contracts/.env.example"

echo ""

# === WEB STRUCTURE ===
echo "📁 Setting up apps/web..."

# App directories
create_directory "apps/web/app/api/asset/[...path]"

# App files
create_file_if_not_exists "apps/web/app/layout.tsx"
create_file_if_not_exists "apps/web/app/page.tsx"
create_file_if_not_exists "apps/web/app/globals.css"
create_file_if_not_exists "apps/web/app/api/asset/[...path]/route.ts"

# Components
create_directory "apps/web/components"
create_file_if_not_exists "apps/web/components/WalletButton.tsx"
create_file_if_not_exists "apps/web/components/CTAButton.tsx"
create_file_if_not_exists "apps/web/components/ChoiceModal.tsx"
create_file_if_not_exists "apps/web/components/MintLoader.tsx"
create_file_if_not_exists "apps/web/components/Triptych.tsx"
create_file_if_not_exists "apps/web/components/FortuneCard.tsx"
create_file_if_not_exists "apps/web/components/MarketLinks.tsx"
create_file_if_not_exists "apps/web/components/RestartButton.tsx"

# Lib and hooks
create_directory "apps/web/lib/hooks"
create_file_if_not_exists "apps/web/lib/wagmi.ts"
create_file_if_not_exists "apps/web/lib/web3modal.ts"
create_file_if_not_exists "apps/web/lib/contracts.ts"
create_file_if_not_exists "apps/web/lib/store.ts"
create_file_if_not_exists "apps/web/lib/hooks/useEligibleBurns.ts"
create_file_if_not_exists "apps/web/lib/hooks/useMintPack.ts"
create_file_if_not_exists "apps/web/lib/hooks/useBurnAndMint.ts"
create_file_if_not_exists "apps/web/lib/hooks/useMintFortune.ts"
create_file_if_not_exists "apps/web/lib/hooks/useTxToasts.ts"

# Public assets
create_directory "apps/web/public/video"
create_directory "apps/web/public/images"
create_file_if_not_exists "apps/web/public/video/hero.mp4"
create_file_if_not_exists "apps/web/public/images/logo.svg"
create_file_if_not_exists "apps/web/public/images/favicon.ico"

# Styles
create_directory "apps/web/styles"
create_file_if_not_exists "apps/web/styles/tailwind.config.ts"

# Config files
create_file_if_not_exists "apps/web/package.json"
create_file_if_not_exists "apps/web/tsconfig.json"
create_file_if_not_exists "apps/web/next.config.js"
create_file_if_not_exists "apps/web/.env.example"

echo ""

# === DOCS STRUCTURE ===
echo "📁 Setting up docs..."

create_directory "docs"
create_file_if_not_exists "docs/README.md"
create_file_if_not_exists "docs/SETUP.md"
create_file_if_not_exists "docs/scratchpad.md"
create_file_if_not_exists "docs/SECURITY.md"

echo ""

# === ROOT FILES ===
echo "📁 Setting up root files..."

create_file_if_not_exists ".gitignore"
create_file_if_not_exists "package.json"

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Directory structure has been created successfully."
echo "Next steps:"
echo "  1. Review the created files"
echo "  2. Add content to the placeholder files"
echo "  3. Install dependencies (npm install, forge install, etc.)"
echo ""


