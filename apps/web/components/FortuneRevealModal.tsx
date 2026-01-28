'use client';

interface FortuneRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardIds: readonly [bigint, bigint, bigint];
  onMintFortune: () => void;
  isMinting: boolean;
}

export function FortuneRevealModal({ isOpen, onClose, cardIds, onMintFortune, isMinting }: FortuneRevealModalProps) {
  const handleReveal = () => {
    onMintFortune();
    // Don't close modal yet - parent will handle navigation
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-black border-4 border-white max-w-2xl w-full p-12 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl"
          disabled={isMinting}
        >
          ×
        </button>

        <h2 className="text-3xl font-bold mb-6 text-white">The Final Revelation</h2>
        
        <div className="space-y-6 text-white/90 jersey-10">
          <p>
            You have gathered your three cards. Each holds a fragment of truth.
          </p>
          
          <p>
            The great Prophet will now weave these fragments into your complete fortune - 
            a unique NFT that exists only for you, generated entirely on-chain.
          </p>

          <p className="text-sm text-white/70 !mb-4">
            Your fortune will be composed from the cards you hold and stored permanently on the blockchain.
          </p>
        </div>

        <button
          onClick={handleReveal}
          disabled={isMinting}
          className="mt-8 w-full px-8 py-4 !text-4xl font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isMinting && (
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
          )}
          {isMinting ? 'Revealing Fortune...' : 'Reveal Final Card (Free)'}
        </button>
      </div>
    </div>
  );
}
