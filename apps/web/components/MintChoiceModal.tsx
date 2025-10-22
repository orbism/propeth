'use client';

import { useAppStore } from '@/lib/store';
import Image from 'next/image';
import { OPENSEA_ITEM_URL } from '@/lib/env';
import { ModalFrame } from '@/components/ui/ModalFrame';

interface MintChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (isPromiseHolder: boolean) => void;
}

export function MintChoiceModal({ isOpen, onClose, onProceed }: MintChoiceModalProps) {
  const { isPromiseHolder } = useAppStore();

  if (!isOpen) return null;

  const handleProceed = () => {
    onProceed(isPromiseHolder || false);
  };

  return (
    <ModalFrame isOpen={isOpen} onClose={onClose}>
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-5xl jacquard-12">Choose Your Path</h2>
        </div>

        <div className="space-y-8">
            {isPromiseHolder ? (
              <div className="text-center p-8 ">
                <h3 className="text-3xl underline mb-4 text-green-400 !mt-3">
                  You are a keeper of A Promise
                </h3>
                <p className="text-3xl relative block !mb-6 !mt-3 ">
                  Burn your Promise below to proceed and receive your fortune from <br/> The Great Propeth.
                </p>
                <div className="text-2xl opacity-70 mb-4">
                  OpenSea: <a
                    href={OPENSEA_ITEM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    View A Promise
                  </a>
                </div>
                <button
                  onClick={handleProceed}
                  className="!px-12 !py-6 !text-5xl blink font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300"
                  style={{
                    animation: 'blink 0.55s infinite',
                  }}
                >
                  Burn
                </button>
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-white/50 bg-white/5">
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">
                  You do not hold A Promise
                </h3>
                <p className="text-lg mb-6">
                  However, you may continue with a fortune by inserting 0.02 Ξ coins.
                </p>
                <div className="text-sm opacity-70 mb-4">
                  <a
                    href={OPENSEA_ITEM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    View A Promise on OpenSea
                  </a>
                </div>
                <button
                  onClick={handleProceed}
                  className="px-12 py-6 text-2xl font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300"
                >
                  Continue (0.02 Ξ)
                </button>
              </div>
            )}
        </div>
      </div>
    </ModalFrame>
  );
}
