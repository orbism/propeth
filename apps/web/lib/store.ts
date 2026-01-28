import { create } from 'zustand';

type FlowStep = 'landing' | 'token-check' | 'mint-choice' | 'burn-explainer' | 'minting' | 'triptych-display' | 'fortune-reveal' | 'fourth-card-mint' | 'complete';

// Store strings to avoid BigInt serialization issues with React DevTools
// Consumers convert to bigint when needed
interface AppState {
  // Flow control
  currentStep: FlowStep;
  setCurrentStep: (step: FlowStep) => void;

  // Minted cards (3 card IDs) - stored as strings for serialization
  triptychIds: readonly [string, string, string] | null;
  setTriptychIds: (ids: readonly [string, string, string]) => void;

  // Minted fortune token ID - stored as string for serialization
  fortuneTokenId: string | null;
  setFortuneTokenId: (id: bigint) => void;

  // Promise holder status
  isPromiseHolder: boolean | null;
  setPromiseHolderStatus: (status: boolean) => void;

  // Owned Promise token IDs (for dynamic selection instead of hardcoding)
  ownedTokenIds: string[];
  setOwnedTokenIds: (ids: string[]) => void;

  // Transaction states
  packTxHash: `0x${string}` | null;
  fortuneTxHash: `0x${string}` | null;
  setPackTxHash: (hash: `0x${string}` | null) => void;
  setFortuneTxHash: (hash: `0x${string}` | null) => void;

  // Reset flow
  reset: () => void;
}

// Helper to convert string tuple back to bigint tuple
export function triptychIdsToBigInt(ids: readonly [string, string, string] | null): readonly [bigint, bigint, bigint] | null {
  if (!ids) return null;
  return [BigInt(ids[0]), BigInt(ids[1]), BigInt(ids[2])] as const;
}

// Helper to convert string back to bigint
export function fortuneTokenIdToBigInt(id: string | null): bigint | null {
  return id ? BigInt(id) : null;
}

export const useAppStore = create<AppState>((set) => ({
  currentStep: 'landing',
  setCurrentStep: (step) => set({ currentStep: step }),

  triptychIds: null,
  setTriptychIds: (ids) => set({
    triptychIds: [ids[0], ids[1], ids[2]] as const
  }),

  fortuneTokenId: null,
  setFortuneTokenId: (id) => set({ fortuneTokenId: id.toString() }),

  isPromiseHolder: null,
  setPromiseHolderStatus: (status) => set({ isPromiseHolder: status }),

  ownedTokenIds: [],
  setOwnedTokenIds: (ids) => set({ ownedTokenIds: ids }),

  packTxHash: null,
  fortuneTxHash: null,
  setPackTxHash: (hash) => set({ packTxHash: hash }),
  setFortuneTxHash: (hash) => set({ fortuneTxHash: hash }),

  reset: () =>
    set({
      currentStep: 'landing',
      triptychIds: null,
      fortuneTokenId: null,
      isPromiseHolder: null,
      ownedTokenIds: [],
      packTxHash: null,
      fortuneTxHash: null,
    }),
}));