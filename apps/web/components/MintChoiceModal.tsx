'use client';

import { useAppStore } from '@/lib/store';
import Image from 'next/image';

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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-black border-4 border-white text-white p-8 max-w-2xl w-full">
        {/* Decorative Frame Corners */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/images/frame_tl.png"
            alt=""
            width={150}
            height={150}
            className="absolute top-0 left-0"
          />
          <Image
            src="/images/frame_tr.png"
            alt=""
            width={150}
            height={150}
            className="absolute top-0 right-0"
          />
          <Image
            src="/images/frame_bl.png"
            alt=""
            width={150}
            height={150}
            className="absolute bottom-0 left-0"
          />
          <Image
            src="/images/frame_br.png"
            alt=""
            width={150}
            height={150}
            className="absolute bottom-0 right-0"
          />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Choose Your Path</h2>
            <button onClick={onClose} className="text-4xl hover:opacity-70">
              ×
            </button>
          </div>

          <div className="space-y-8">
            {isPromiseHolder ? (
              <div className="text-center p-8 border-2 border-white/50 bg-white/5">
                <h3 className="text-2xl font-bold mb-4 text-green-400">
                  You are a keeper of A Promise
                </h3>
                <p className="text-lg mb-6">
                  Click "Burn" below to proceed and receive your fortune from The Great Propeth.
                </p>
                <div className="text-sm opacity-70 mb-4">
                  OpenSea: <a
                    href="https://opensea.io/item/ethereum/0x2eaa8c468aa638c88bd704e3a2b03d9926f0b397/3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    View A Promise
                  </a>
                </div>
                <button
                  onClick={handleProceed}
                  className="px-12 py-6 text-2xl font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300"
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
                    href="https://opensea.io/item/ethereum/0x2eaa8c468aa638c88bd704e3a2b03d9926f0b397/3"
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
      </div>
    </div>
  );
}
