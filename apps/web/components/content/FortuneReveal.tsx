'use client';

import { useAppStore } from '@/lib/store';

interface FortuneRevealProps {
  cardIds: readonly [string, string, string];
  onMintFortune: () => void;
  isMinting: boolean;
}

export function FortuneReveal({ cardIds, onMintFortune, isMinting }: FortuneRevealProps) {
  const { setCurrentStep } = useAppStore();

  const handleReveal = () => {
    setCurrentStep('fourth-card-mint');
    onMintFortune();
  };

  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <div className="w-full max-w-3xl">
        <h2 className="text-6xl font-bold mb-16 text-white text-center jacquard-12">The Final Revelation</h2>
        
        <div className="space-y-10 text-white/90 mb-12 text-center !my-12">
          <p className="text-2xl leading-relaxed jersey-10">
            You have gathered your three cards. Each holds a fragment of truth.
          </p>

          <p className="text-2xl leading-relaxed">
            The great Prophet will now weave these fragments into your complete fortune -
            a unique NFT that exists only for you, generated entirely on-chain.
          </p>

          <p className="text-lg text-white/70 leading-relaxed mb-4">
            Your fortune will be composed from the cards you hold and stored permanently on the blockchain.
          </p>
        </div>

        <button
          onClick={handleReveal}
          disabled={isMinting}
          className="w-full px-12 py-8 !text-4xl font-bold border-4 border-green-600 text-white hover:bg-green-600/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed jacquard-12"
        >
          {isMinting ? 'Revealing...' : 'Reveal Final Card (Free)'}
        </button>
      </div>
    </div>
  );
}
