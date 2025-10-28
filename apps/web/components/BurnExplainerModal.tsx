'use client';

import { ModalFrame } from './ui/ModalFrame';

interface BurnExplainerModalProps {
  isOpen: boolean;
  onProceed: () => void;
  onCancel: () => void;
}

export function BurnExplainerModal({ isOpen, onProceed, onCancel }: BurnExplainerModalProps) {
  if (!isOpen) return null;

  return (
    <ModalFrame isOpen={isOpen} onClose={onCancel}>
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-center">Burn Your Promise</h2>
        
        <div className="!space-y-4 text-gray-300">
          <p>
            You're about to <span className="text-white font-semibold">burn</span> your "A Promise" NFT 
            to receive <span className="text-white font-semibold">3 fortune cards for free</span>.
          </p>
          
          <div className="bg-gray-900 border border-gray-700 rounded !p-4 space-y-2">
            <p className="text-white font-semibold">What happens next:</p>
            <ol className="list-decimal list-inside space-y-1 !text-2xl">
              <li>Approve the burn adapter for token #0 (1st transaction)</li>
              <li>Adapter burns your Promise and gateway mints 3 cards (2nd transaction)</li>
              <li>Your Promise NFT is destroyed permanently</li>
            </ol>
          </div>

          <p className="text-yellow-400 !text-2xl !py-3">
            ⚠️ Your wallet shows "giving permission to withdraw" — this is standard erc721 behavior. 
            The approval allows the burn adapter to destroy only your Promise NFT.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="!border !border-red-800 !rounded flex-1 px-6 !py-3 hover:bg-white/10 transition-colors !text-2xl"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="!border !border-green-800 flex-1 px-6 py-3 !hover:bg-black hover:text-white transition-colors font-semibold !text-2xl"
          >
            Proceed to Burn
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

