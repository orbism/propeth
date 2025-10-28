'use client';

import { LandingPage } from '@/components/LandingPage';
import { TokenCheckModal } from '@/components/TokenCheckModal';
import { MintChoiceModal } from '@/components/MintChoiceModal';
import { BurnExplainerModal } from '@/components/BurnExplainerModal';
import { FortuneRevealModal } from '@/components/FortuneRevealModal';
import { FourthCardModal } from '@/components/FourthCardModal';
import { MintLoader } from '@/components/MintLoader';
import { Triptych } from '@/components/Triptych';
import { FortuneCard } from '@/components/FortuneCard';
import { MarketLinks } from '@/components/MarketLinks';
import { RestartButton } from '@/components/RestartButton';
import { useAppStore } from '@/lib/store';
import { useMintPack } from '@/lib/hooks/useMintPack';
import { useMintFortune } from '@/lib/hooks/useMintFortune';
import { useBurnAndMint } from '@/lib/hooks/useBurnAndMint';
import { useCheckExistingProgress } from '@/lib/hooks/useCheckExistingProgress';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { FORTUNE721_ADDRESS } from '@/lib/contracts';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { currentStep, triptychIds, fortuneTokenId, setCurrentStep } = useAppStore();
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showTokenCheck, setShowTokenCheck] = useState(false);
  const [showBurnExplainer, setShowBurnExplainer] = useState(false);
  const [showFortuneReveal, setShowFortuneReveal] = useState(false);
  const [showFourthCardModal, setShowFourthCardModal] = useState(false);

  const { mintPack, isPending: isMintingPack, error: mintPackError, hash: packHash } = useMintPack();
  const { mintFortune, isPending: isMintingFortune, error: mintFortuneError, hash: fortuneHash, isSuccess: fortuneMintSuccess } = useMintFortune();
  const { burnAndMint, isPending: isBurning } = useBurnAndMint();
  const { checkProgress, isChecking: isCheckingProgress } = useCheckExistingProgress();

  // Close modal when fortune is successfully minted
  useEffect(() => {
    if (fortuneMintSuccess && fortuneTokenId !== null) {
      console.log('[Home] Fortune minted and token ID set, closing modal');
      setShowFortuneReveal(false);
    }
  }, [fortuneMintSuccess, fortuneTokenId]);

  const handleInsertCoin = async () => {
    if (!isConnected || !address) return;
    
    console.log('[Home] Insert coin clicked, checking existing progress...');
    
    // Check if user already has cards or fortune
    const result = await checkProgress();
    
    console.log('[Home] Progress check result:', result);
    
    // If they have cards or fortune, checkProgress already navigated them
    // If they have nothing, show the token check modal
    if (result === 'none') {
      console.log('[Home] No existing progress, showing token check');
      setShowTokenCheck(true);
    }
  };

  const handleTokenCheckComplete = () => {
    setShowTokenCheck(false);
    setShowChoiceModal(true);
  };

  const handleMintChoice = (isPromiseHolder: boolean) => {
    setShowChoiceModal(false);
    if (address) {
      if (isPromiseHolder) {
        // Show explainer before burning
        setShowBurnExplainer(true);
      } else {
        // Mint fresh pack for non-holders
        mintPack(address);
      }
    }
  };

  const handleBurnProceed = () => {
    setShowBurnExplainer(false);
    if (address) {
      const promiseNftAddress = process.env.NEXT_PUBLIC_PROMISE_NFT as `0x${string}`;
      if (!promiseNftAddress) {
        console.error('NEXT_PUBLIC_PROMISE_NFT not configured');
        alert('Promise NFT address not configured. Check .env.local');
        return;
      }
      // Token ID 0 (from DeployMockNFT script)
      burnAndMint(promiseNftAddress, BigInt(0));
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

      {/* Burn Explainer Modal */}
      <BurnExplainerModal
        isOpen={showBurnExplainer}
        onProceed={handleBurnProceed}
        onCancel={() => setShowBurnExplainer(false)}
      />

      {/* Minting Loader */}
      {currentStep === 'minting' && (
        <MintLoader
          status={mintPackError ? 'error' : ((isMintingPack || isBurning) ? 'confirming' : 'pending')}
          txHash={packHash || undefined}
          error={mintPackError}
          onClose={() => {
            if (mintPackError) {
              setCurrentStep('landing');
            }
          }}
        />
      )}

      {/* Triptych Display */}
      {currentStep === 'triptych-display' && triptychIds && (
        <Triptych 
          cardIds={triptychIds}
          hasFortune={fortuneTokenId !== null}
          onContinue={() => {
            if (fortuneTokenId !== null) {
              // Already has fortune, go straight to display
              setCurrentStep('complete');
            } else {
              // No fortune yet, show reveal modal
              setShowFortuneReveal(true);
            }
          }}
        />
      )}

      {/* Fortune Reveal Modal */}
      {triptychIds && (
        <FortuneRevealModal
          isOpen={showFortuneReveal}
          onClose={() => setShowFortuneReveal(false)}
          cardIds={triptychIds}
          onMintFortune={mintFortune}
          isMinting={isMintingFortune}
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