'use client';

import { WalletButton } from '@/components/WalletButton';
import { CTAButton } from '@/components/CTAButton';
import { ChoiceModal } from '@/components/ChoiceModal';
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

  const { mintPack, isPending: isMintingPack, error: mintPackError, hash: packHash } = useMintPack();
  const { mintFortune, isPending: isMintingFortune, error: mintFortuneError, hash: fortuneHash } = useMintFortune();

  const handleCTAClick = () => {
    if (!isConnected) return;
    setShowChoiceModal(true);
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
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center backdrop-blur-sm">
        <div className="text-xl font-bold">BEZMIAR</div>
        <WalletButton />
      </header>

      {/* Landing */}
      {currentStep === 'landing' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-8">
              Fortune Teller
            </h1>
            <CTAButton 
              onClick={handleCTAClick}
              disabled={!isConnected}
            />
            {!isConnected && (
              <p className="text-gray-400 mt-4">Connect your wallet to begin</p>
            )}
          </div>
        </div>
      )}

      {/* Choice Modal */}
      <ChoiceModal
        isOpen={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        onBurnRedeem={handleBurnRedeem}
        onMintFresh={handleMintFresh}
      />

      {/* Minting Loader */}
      {currentStep === 'minting' && (
        <MintLoader
          status={isMintingPack ? 'confirming' : 'pending'}
          txHash={packHash || undefined}
          error={mintPackError}
        />
      )}

      {/* Triptych */}
      {currentStep === 'triptych' && triptychIds && (
        <Triptych
          cardIds={triptychIds}
          onContinue={() => mintFortune()}
        />
      )}

      {/* Fortune Minting Loader */}
      {currentStep === 'fortune-minting' && (
        <MintLoader
          status={isMintingFortune ? 'confirming' : 'pending'}
          txHash={fortuneHash || undefined}
          error={mintFortuneError}
        />
      )}

      {/* Fortune Result */}
      {currentStep === 'fortune-result' && fortuneTokenId !== null && (
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