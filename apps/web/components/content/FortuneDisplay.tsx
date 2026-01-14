'use client';

import Link from 'next/link';
import { FortuneCard } from '../FortuneCard';
import { MarketLinks } from '../MarketLinks';
import { RestartButton } from '../RestartButton';
import { useAppStore } from '@/lib/store';
import { FORTUNE721_ADDRESS } from '@/lib/contracts';

interface FortuneDisplayProps {
  tokenId: bigint;
}

export function FortuneDisplay({ tokenId }: FortuneDisplayProps) {
  const { setCurrentStep } = useAppStore();

  const handleBackToFate = () => {
    setCurrentStep('triptych-display');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-6xl w-full">
        {/* Fortune Card - Significantly Larger */}
        <div className="!-mt-10 text-center">
          <FortuneCard tokenId={tokenId} />
        </div>

        {/* Go Back to Fate Cards Button */}
        <div className="!flex !flex-col !gap-2 !items-center">
          <button
            onClick={handleBackToFate}
            className="px-12 !pt-4 !-mb-4 !text-xl font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300"
          >
            go back to fate cards
          </button>
          <p className="!text-lg !-mb-4">or</p>

          {/* Restart Button */}
          <RestartButton />

          {/* View Past Readings Link */}
          <Link
            href="/my-readings"
            className="!mt-4 text-white/60 hover:text-white transition-colors jacquard-12 text-lg"
          >
            view all my readings &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
