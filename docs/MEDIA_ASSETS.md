# Bezmiar Fortune Teller - Media Assets Checklist

**Total Required:** 2 files (1 required + 1 optional)

---

## 1. Background Image (REQUIRED)

- [ ] `fortune-background.png`

**Specifications:**
- Recommended dimensions: 1000×1000px (square)
- Format: PNG
- Purpose: Base background for all fortune cards
- This is the same for all fortunes
- Will display behind 3 lines of text

**Design Notes:**
- Keep center area clear for text readability
- Consider text positioning: y=350, y=500, y=650
- Text will be white (#fff), so dark background recommended
- Leave space for centered text at these three vertical positions

---

## 2. Custom Font (OPTIONAL)

- [ ] `fortune-font.woff` or `fortune-font.woff2`

**Specifications:**
- Format: WOFF or WOFF2 (web fonts)
- Purpose: Custom typography for fortune text
- Falls back to serif if not provided
- Should be readable at 32px size

**Design Notes:**
- Choose mystical/elegant font if custom
- Ensure legibility at smaller sizes
- Test with longest text strings from CSV
- Web-safe fallback: serif

---

## Text Content

All fortune text is stored on-chain from `prophet.csv`. No image files needed for text.

### Text Structure:
- 15 cards (0-14)
- 3 positions per card
- 2 variants (A/B) per position
- Total: 90 text strings

**Example composition:**
```
Background: fortune-background.png
Text 1 (y=350): "The unknown watches in silence"
Text 2 (y=500): "but struggle will come to an end."
Text 3 (y=650): "Now it's time to reflect."
Font: Custom or serif fallback
```

---

## Delivery Structure

```
fortune-assets/
├── fortune-background.png     (REQUIRED - 1000x1000px PNG)
└── fortune-font.woff2          (OPTIONAL - custom web font)
```

---

## Upload Process

### 1. Upload Background to IPFS
```bash
# Upload background PNG
ipfs add fortune-background.png

# Get CID (e.g., QmXYZ123...)
```

### 2. Upload Font to IPFS (optional)
```bash
# Upload font file
ipfs add fortune-font.woff2

# Get CID
```

### 3. Configure Contract
```bash
# Set background
cast send $FORTUNE721 "setBaseBgCID(string)" "QmXYZ123..." --rpc-url ...

# Set font (optional)
cast send $FORTUNE721 "setFontURI(string)" "ipfs://QmFONT456..." --rpc-url ...
```

### 4. Load Text Data
```bash
# Run text loading script
forge script script/LoadTexts.s.sol --rpc-url base_sepolia --broadcast
```

---

## Example Fortune Output

**SVG Structure:**
```svg
<svg viewBox="0 0 1000 1000">
  <!-- Background image -->
  <image href="ipfs://QmBackground..." />
  
  <!-- Three text lines, centered -->
  <text x="500" y="350" fill="#fff" font-size="32">
    No ending is absolute
  </text>
  <text x="500" y="500" fill="#fff" font-size="32">
    but struggle will come to an end.
  </text>
  <text x="500" y="650" fill="#fff" font-size="32">
    The sadness will end.
  </text>
</svg>
```

---

## Advantages Over Image Fragments

✅ **2 files instead of 91**  
✅ **Text editable on-chain** (can update without re-uploading)  
✅ **No IPFS dependencies** for fortune content  
✅ **Faster iteration** (change text via contract call)  
✅ **Lower storage costs** (strings vs many CIDs)  
✅ **Fully on-chain** fortune generation  

---

## Testing Preview

To preview a fortune before deployment:
1. Create SVG with your background
2. Add 3 text lines at y=350, 500, 650
3. Test with longest strings from CSV:
   - "The unknown watches in silence"
   - "but struggle will come to an end."
   - "Find what was hidden."

---

**Status:** Simplified approach - awaiting background PNG + optional font

### Card 00
- [ ] `card-00-pos1-varA.png`
- [ ] `card-00-pos1-varB.png`
- [ ] `card-00-pos2-varA.png`
- [ ] `card-00-pos2-varB.png`
- [ ] `card-00-pos3-varA.png`
- [ ] `card-00-pos3-varB.png`

### Card 01
- [ ] `card-01-pos1-varA.png`
- [ ] `card-01-pos1-varB.png`
- [ ] `card-01-pos2-varA.png`
- [ ] `card-01-pos2-varB.png`
- [ ] `card-01-pos3-varA.png`
- [ ] `card-01-pos3-varB.png`

### Card 02
- [ ] `card-02-pos1-varA.png`
- [ ] `card-02-pos1-varB.png`
- [ ] `card-02-pos2-varA.png`
- [ ] `card-02-pos2-varB.png`
- [ ] `card-02-pos3-varA.png`
- [ ] `card-02-pos3-varB.png`

### Card 03
- [ ] `card-03-pos1-varA.png`
- [ ] `card-03-pos1-varB.png`
- [ ] `card-03-pos2-varA.png`
- [ ] `card-03-pos2-varB.png`
- [ ] `card-03-pos3-varA.png`
- [ ] `card-03-pos3-varB.png`

### Card 04
- [ ] `card-04-pos1-varA.png`
- [ ] `card-04-pos1-varB.png`
- [ ] `card-04-pos2-varA.png`
- [ ] `card-04-pos2-varB.png`
- [ ] `card-04-pos3-varA.png`
- [ ] `card-04-pos3-varB.png`

### Card 05
- [ ] `card-05-pos1-varA.png`
- [ ] `card-05-pos1-varB.png`
- [ ] `card-05-pos2-varA.png`
- [ ] `card-05-pos2-varB.png`
- [ ] `card-05-pos3-varA.png`
- [ ] `card-05-pos3-varB.png`

### Card 06
- [ ] `card-06-pos1-varA.png`
- [ ] `card-06-pos1-varB.png`
- [ ] `card-06-pos2-varA.png`
- [ ] `card-06-pos2-varB.png`
- [ ] `card-06-pos3-varA.png`
- [ ] `card-06-pos3-varB.png`

### Card 07
- [ ] `card-07-pos1-varA.png`
- [ ] `card-07-pos1-varB.png`
- [ ] `card-07-pos2-varA.png`
- [ ] `card-07-pos2-varB.png`
- [ ] `card-07-pos3-varA.png`
- [ ] `card-07-pos3-varB.png`

### Card 08
- [ ] `card-08-pos1-varA.png`
- [ ] `card-08-pos1-varB.png`
- [ ] `card-08-pos2-varA.png`
- [ ] `card-08-pos2-varB.png`
- [ ] `card-08-pos3-varA.png`
- [ ] `card-08-pos3-varB.png`

### Card 09
- [ ] `card-09-pos1-varA.png`
- [ ] `card-09-pos1-varB.png`
- [ ] `card-09-pos2-varA.png`
- [ ] `card-09-pos2-varB.png`
- [ ] `card-09-pos3-varA.png`
- [ ] `card-09-pos3-varB.png`

### Card 10
- [ ] `card-10-pos1-varA.png`
- [ ] `card-10-pos1-varB.png`
- [ ] `card-10-pos2-varA.png`
- [ ] `card-10-pos2-varB.png`
- [ ] `card-10-pos3-varA.png`
- [ ] `card-10-pos3-varB.png`

### Card 11
- [ ] `card-11-pos1-varA.png`
- [ ] `card-11-pos1-varB.png`
- [ ] `card-11-pos2-varA.png`
- [ ] `card-11-pos2-varB.png`
- [ ] `card-11-pos3-varA.png`
- [ ] `card-11-pos3-varB.png`

### Card 12
- [ ] `card-12-pos1-varA.png`
- [ ] `card-12-pos1-varB.png`
- [ ] `card-12-pos2-varA.png`
- [ ] `card-12-pos2-varB.png`
- [ ] `card-12-pos3-varA.png`
- [ ] `card-12-pos3-varB.png`

### Card 13
- [ ] `card-13-pos1-varA.png`
- [ ] `card-13-pos1-varB.png`
- [ ] `card-13-pos2-varA.png`
- [ ] `card-13-pos2-varB.png`
- [ ] `card-13-pos3-varA.png`
- [ ] `card-13-pos3-varB.png`

### Card 14
- [ ] `card-14-pos1-varA.png`
- [ ] `card-14-pos1-varB.png`
- [ ] `card-14-pos2-varA.png`
- [ ] `card-14-pos2-varB.png`
- [ ] `card-14-pos3-varA.png`
- [ ] `card-14-pos3-varB.png`

---

## File Specifications

**All Fragment PNGs:**
- Format: PNG with transparency
- Dimensions: 1000×1000px (match base background)
- Color mode: RGBA
- Optimized for web (compressed)
- Designed to layer correctly over base background

**Naming Convention:**
- `card-{ID}-pos{POSITION}-var{VARIANT}.png`
- ID: 00-14 (zero-padded, 2 digits)
- POSITION: 1, 2, or 3
- VARIANT: A or B

---

## Delivery Structure

Organize files for easy IPFS upload:

```
fortune-assets/
├── base/
│   └── fortune-base-bg.png
└── fragments/
    ├── card-00/
    │   ├── card-00-pos1-varA.png
    │   ├── card-00-pos1-varB.png
    │   ├── card-00-pos2-varA.png
    │   ├── card-00-pos2-varB.png
    │   ├── card-00-pos3-varA.png
    │   └── card-00-pos3-varB.png
    ├── card-01/
    │   └── ... (6 files)
    ... (continue for cards 02-14)
    └── card-14/
        └── ... (6 files)
```

---

## Upload Process

1. Upload `base/fortune-base-bg.png` to IPFS → get CID
2. Upload each fragment to IPFS → get CIDs
3. Call `Fortune721.setBaseBgCID(baseCID)`
4. Call `Fortune721.setFragmentCIDBatch(cardIds, positions, variants, cids)` to set all fragment CIDs

---

## Example Composition

**Fortune with cards [5, 12, 3]:**

```
Layer 1 (base):       fortune-base-bg.png
Layer 2 (card 5, pos1): card-05-pos1-varA.png  (or varB, 50/50 chance)
Layer 3 (card 12, pos2): card-12-pos2-varB.png  (or varA, 50/50 chance)
Layer 4 (card 3, pos3):  card-03-pos3-varA.png  (or varB, 50/50 chance)
```

Result: 4-layer composited image with base + 3 transparent overlays

---

## Notes for Designer

- Each card contributes to 3 different positions
- Each position has 2 variants (A and B) for variety
- Total possible combinations: C(15,3) × 3! × 2³ = 455 × 6 × 8 = 21,840 unique fortunes
- Design fragments to work when layered in any valid combination
- Test layering with multiple combinations before final delivery
- Ensure transparency is correct (no white/black backgrounds)

---

**Status:** Pending designer delivery