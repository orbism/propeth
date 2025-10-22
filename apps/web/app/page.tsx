'use client';

import { LandingPage } from '@/components/LandingPage';
import { TokenCheckModal } from '@/components/TokenCheckModal';
import { MintChoiceModal } from '@/components/MintChoiceModal';
import { FourthCardModal } from '@/components/FourthCardModal';
import { MintLoader } from '@/components/MintLoader';
import { Triptych } from '@/components/Triptych';
import { FortuneCard } from '@/components/FortuneCard';
import { MarketLinks } from '@/components/MarketLinks';
import { RestartButton } from '@/components/RestartButton';
import { useAppStore } from '@/lib/store';
import { useMintPack } from '@/lib/hooks/useMintPack';
import { useMintFortune } from '@/lib/hooks/useMintFortune';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { FORTUNE721_ADDRESS } from '@/lib/contracts';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { currentStep, triptychIds, fortuneTokenId, setCurrentStep } = useAppStore();
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showTokenCheck, setShowTokenCheck] = useState(false);
  const [showFourthCardModal, setShowFourthCardModal] = useState(false);

  const { mintPack, isPending: isMintingPack, error: mintPackError, hash: packHash } = useMintPack();
  const { mintFortune, isPending: isMintingFortune, error: mintFortuneError, hash: fortuneHash } = useMintFortune();

  const handleInsertCoin = () => {
    if (!isConnected) return;
    setShowTokenCheck(true);
  };

  const handleTokenCheckComplete = () => {
    setShowTokenCheck(false);
    setShowChoiceModal(true);
  };

  const handleMintChoice = (isPromiseHolder: boolean) => {
    setShowChoiceModal(false);
    if (address) {
      if (isPromiseHolder) {
        // TODO: Implement burn flow for Promise holders
        alert('Burn flow for Promise holders not yet implemented');
      } else {
        // Mint fresh pack for non-holders
        mintPack(address);
      }
    }
  };

  const handleMintFresh = () => {
    setShowChoiceModal(false);
    if (address) {
      mintPack(address);
    }
  };

  const handleBurnRedeem = () => {
    setShowChoiceModal(false);
    // TODO: implement burn flow
    alert('Burn redeem not yet implemented');
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-end items-center backdrop-blur-sm">
        {/* Wallet connection moved to content area */}
      </header>

      {/* Landing */}
      {currentStep === 'landing' && (
        <LandingPage onInsertCoin={handleInsertCoin} />
      )}

      {/* Token Check Modal */}
      <TokenCheckModal
        isOpen={showTokenCheck}
        onComplete={handleTokenCheckComplete}
      />

      {/* Mint Choice Modal */}
      <MintChoiceModal
        isOpen={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        onProceed={handleMintChoice}
      />

      {/* Minting Loader */}
      {currentStep === 'minting' && (
        <MintLoader
          status={isMintingPack ? 'confirming' : 'pending'}
          txHash={packHash || undefined}
          error={mintPackError}
        />
      )}

      {/* Triptych Display */}
      {currentStep === 'triptych-display' && triptychIds && (
        <Triptych
          cardIds={triptychIds}
          onContinue={() => setShowFourthCardModal(true)}
        />
      )}

      {/* Fourth Card Modal */}
      {triptychIds && (
        <FourthCardModal
          isOpen={showFourthCardModal}
          onClose={() => setShowFourthCardModal(false)}
          cardIds={triptychIds}
        />
      )}

      {/* Fourth Card Minting Loader */}
      {currentStep === 'fourth-card-mint' && (
        <MintLoader
          status={isMintingFortune ? 'confirming' : 'pending'}
          txHash={fortuneHash || undefined}
          error={mintFortuneError}
        />
      )}

      {/* Fortune Result */}
      {currentStep === 'complete' && fortuneTokenId !== null && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <FortuneCard tokenId={fortuneTokenId} />
            <div className="mt-8 space-y-4 flex flex-col items-center">
              <MarketLinks
                collectionAddress={FORTUNE721_ADDRESS}
                tokenId={fortuneTokenId}
              />
              <RestartButton />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}