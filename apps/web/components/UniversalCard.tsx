'use client';

import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { LandingContent } from './content/LandingContent';
import { TokenCheck } from './content/TokenCheck';
import { MintChoice } from './content/MintChoice';
import { BurnExplainer } from './content/BurnExplainer';
import { MintLoader } from './content/MintLoader';
import { TriptychDisplay } from './content/TriptychDisplay';
import { FortuneReveal } from './content/FortuneReveal';
import { FourthCard } from './content/FourthCard';
import { FortuneDisplay } from './content/FortuneDisplay';
import { useMintPack } from '@/lib/hooks/useMintPack';
import { useMintFortune } from '@/lib/hooks/useMintFortune';
import { useBurnAndMint } from '@/lib/hooks/useBurnAndMint';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

export function UniversalCard() {
  const { address } = useAccount();
  const {
    currentStep,
    triptychIds,
    fortuneTokenId,
    setCurrentStep,
    reset,
    ownedTokenIds,
  } = useAppStore();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedStep, setDisplayedStep] = useState(currentStep);

  const { mintPack, isPending: isMintingPack, error: mintPackError, hash: packHash } = useMintPack();
  const { mintFortune, isPending: isMintingFortune, error: mintFortuneError, hash: fortuneHash } = useMintFortune();
  const { burnAndMint, isPending: isBurning } = useBurnAndMint();

  // Handle step transitions with fade effect
  useEffect(() => {
    if (currentStep !== displayedStep) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedStep(currentStep);
        setIsTransitioning(false);
      }, 300); // Match fade duration
      return () => clearTimeout(timer);
    }
  }, [currentStep, displayedStep]);

  // Close fortune reveal modal when fortune is successfully minted
  useEffect(() => {
    if (isMintingFortune === false && fortuneTokenId !== null) {
      console.log('[UniversalCard] Fortune minted, transitioning to fourth-card-mint');
    }
  }, [isMintingFortune, fortuneTokenId]);

  const handleMintContinue = () => {
    if (address) {
      setCurrentStep('minting');
      mintPack(address);
    }
  };

  const handleBurnProceed = () => {
    if (address) {
      const promiseNftAddress = process.env.NEXT_PUBLIC_PROMISE_NFT as `0x${string}`;
      if (!promiseNftAddress) {
        console.error('NEXT_PUBLIC_PROMISE_NFT not configured');
        alert('Promise NFT address not configured. Check .env.local');
        return;
      }
      
      // Try to use owned token IDs from API, fallback to sequential search (0, 1, 2, ...)
      // The hook will detect if the transaction fails and try the next ID
      const tokenIdToBurn = ownedTokenIds.length > 0 
        ? BigInt(ownedTokenIds[0]) 
        : BigInt(0); // Will iterate if this one fails
      
      console.log('[UniversalCard] Attempting to burn token ID:', tokenIdToBurn.toString());
      
      setCurrentStep('minting');
      burnAndMint(promiseNftAddress, tokenIdToBurn);
    }
  };

  const handleMintFortune = () => {
    mintFortune();
  };

  const renderContent = () => {
    switch (displayedStep) {
      case 'landing':
        return <LandingContent />;
      
      case 'token-check':
        return (
          <TokenCheck
            onComplete={() => setCurrentStep('mint-choice')}
          />
        );
      
      case 'mint-choice':
        return <MintChoice onBurnProceed={handleBurnProceed} onContinueProceed={handleMintContinue} />;
      
      case 'burn-explainer':
        return <BurnExplainer onProceed={handleBurnProceed} />;
      
      case 'minting':
        return (
          <MintLoader
            status={mintPackError || mintFortuneError ? 'error' : ((isMintingPack || isBurning) ? 'confirming' : 'pending')}
            message={
              isMintingPack ? 'Creating your three fortune cards...' :
              isBurning ? 'Burning your Promise NFT...' :
              isMintingFortune ? 'Creating your final fortune...' :
              'Waiting for transaction...'
            }
            txHash={packHash || undefined}
            error={mintPackError || mintFortuneError}
            onClose={() => {
              if (mintPackError || mintFortuneError) {
                setCurrentStep('landing');
              }
            }}
          />
        );
      
      case 'triptych-display':
        return (
          <TriptychDisplay
            cardIds={triptychIds}
            hasFortune={fortuneTokenId !== null}
          />
        );
      
      case 'fortune-reveal':
        return triptychIds ? (
          <FortuneReveal
            cardIds={triptychIds}
            onMintFortune={handleMintFortune}
            isMinting={isMintingFortune}
          />
        ) : null;
      
      case 'fourth-card-mint':
        return (
          <MintLoader
            status={mintFortuneError ? 'error' : (isMintingFortune ? 'confirming' : 'pending')}
            message="Creating your final fortune NFT..."
            txHash={fortuneHash || undefined}
            error={mintFortuneError}
            onClose={() => {
              if (mintFortuneError) {
                setCurrentStep('triptych-display');
              }
            }}
          />
        );
      
      case 'complete':
        return fortuneTokenId !== null ? (
          <FortuneDisplay tokenId={fortuneTokenId} />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Video - PERSISTENT */}
      <video
        autoPlay
        muted
        loop
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      {/* Centered Card Container */}
      <div className="relative z-20 flex items-center justify-center p-8 h-screen">
        <div className="w-[1200px] h-[666px] relative flex items-center justify-center">
          {/* Decorative Frame Corners - positioned relative to card */}
          <div className="absolute inset-0 pointer-events-none">
            <Image
              src="/images/frame_tl.png"
              alt=""
              width={200}
              height={200}
              className="absolute top-0 left-0"
            />
            <Image
              src="/images/frame_tr.png"
              alt=""
              width={200}
              height={200}
              className="absolute top-0 right-0"
            />
            <Image
              src="/images/frame_bl.png"
              alt=""
              width={200}
              height={200}
              className="absolute bottom-0 left-0"
            />
            <Image
              src="/images/frame_br.png"
              alt=""
              width={200}
              height={200}
              className="absolute bottom-0 right-0"
            />
          </div>

          {/* Content Container with Fade Transition */}
          <div 
            className="relative z-30 fade-transition w-full h-full flex items-center justify-center"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
