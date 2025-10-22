'use client';

interface ChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBurnRedeem: () => void;
  onMintFresh: () => void;
}

export function ChoiceModal({ isOpen, onClose, onBurnRedeem, onMintFresh }: ChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-black p-8 max-w-md w-full border-2 border-black">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Choose Your Path</h2>
          <button onClick={onClose} className="text-3xl hover:opacity-70">
            <span className="largest">×</span>
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={onBurnRedeem}
            className="w-full px-6 py-4 border-2 border-black hover:bg-black hover:text-white transition-colors text-left"
          >
            <div className="font-bold mb-1">Burn to Redeem</div>
            <div className="text-sm opacity-70">Sacrifice an existing NFT</div>
          </button>

          <button
            onClick={onMintFresh}
            className="w-full px-6 py-4 border-2 border-black hover:bg-black hover:text-white transition-colors text-left"
          >
            <div className="font-bold mb-1">Mint from Scratch</div>
            <div className="text-sm opacity-70">Purchase a new pack</div>
          </button>
        </div>
      </div>
    </div>
  );
}