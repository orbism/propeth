import { create } from 'zustand';

type FlowStep = 'landing' | 'token-check' | 'mint-choice' | 'burn-explainer' | 'minting' | 'triptych-display' | 'fortune-reveal' | 'fourth-card-mint' | 'complete';

interface AppState {
  // Flow control
  currentStep: FlowStep;
  setCurrentStep: (step: FlowStep) => void;

  // Minted cards (3 card IDs)
  triptychIds: readonly [bigint, bigint, bigint] | null;
  setTriptychIds: (ids: readonly [bigint, bigint, bigint]) => void;

  // Minted fortune token ID
  fortuneTokenId: bigint | null;
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

export const useAppStore = create<AppState>((set) => ({
  currentStep: 'landing',
  setCurrentStep: (step) => set({ currentStep: step }),

  triptychIds: null,
  setTriptychIds: (ids) => set({ triptychIds: ids }),

  fortuneTokenId: null,
  setFortuneTokenId: (id) => set({ fortuneTokenId: id }),

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