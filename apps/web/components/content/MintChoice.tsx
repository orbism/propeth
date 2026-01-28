'use client';

import { useAccount, useBalance } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { OPENSEA_ITEM_URL } from '@/lib/env';
import { PRICE_PER_PACK } from '@/lib/contracts';

interface MintChoiceProps {
  onBurnProceed: () => void;
  onContinueProceed: () => void;
}

export function MintChoice({ onBurnProceed, onContinueProceed }: MintChoiceProps) {
  const { isPromiseHolder, setCurrentStep } = useAppStore();
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const hasEnoughEth = balance && balance.value >= PRICE_PER_PACK;

  const handleBurn = () => {
    setCurrentStep('burn-explainer');
  };

  const handleContinue = () => {
    onContinueProceed();
  };

  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-5xl jacquard-12 text-center mb-8">Choose Your Path</h2>

        <div className="space-y-8">
          {isPromiseHolder ? (
            <div className="text-center p-8">
              <h3 className="text-3xl underline mb-4 text-green-400 !mt-3">
                You are a keeper of A Promise
              </h3>
              <p className="text-3xl relative block !mb-6 !mt-3">
                Burn your Promise below to proceed and receive your fortune from <br /> The Great Propeth.
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
                onClick={handleBurn}
                className="!px-12 !py-6 !text-4xl blink font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300 jacquard-12"
                style={{
                  animation: 'blink 1.2s infinite',
                }}
              >
                <span className="larger">Burn</span>
              </button>
            </div>
          ) : hasEnoughEth ? (
            <div className="text-center p-8">
              <h3 className="text-3xl mb-4 text-red-400 !m-3">
                You do not have A Promise
              </h3>
              <p className="text-3xl block relative !mb-6 !mt-3">
                However, you may continue with a fortune by <br />inserting 0.03 coins.
              </p>
              <div className="text-2xl opacity-70 mb-4">
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
                onClick={handleContinue}
                className="!px-12 !py-6 !text-4xl blink font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300 jacquard-12"
                style={{
                  animation: 'blink 1.2s infinite',
                }}
              >
                Continue <br />(0.03 coins)
              </button>
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-3xl block relative !mb-8 !mt-3">
                You do not have enough coins to get your fortune read at this time.
              </p>
              <button
                onClick={() => setCurrentStep('landing')}
                className="text-[10rem] leading-none hover:scale-110 transition-transform cursor-pointer"
                aria-label="Return to start"
              >
                ☜
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
