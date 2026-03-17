'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { WalletButton } from '../WalletButton';
import { ModalFrame } from '@/components/ui/ModalFrame';
import { useAppStore } from '@/lib/store';
import { useCheckExistingProgress } from '@/lib/hooks/useCheckExistingProgress';
import Image from 'next/image';
import { debug } from '@/lib/debug';

export function LandingContent() {
  const { isConnected } = useAccount();
  const { setCurrentStep } = useAppStore();
  const { checkProgress } = useCheckExistingProgress();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [forceWalletOpen, setForceWalletOpen] = useState(false);

  const handleInsertCoin = async () => {
    if (!isConnected) {
      setForceWalletOpen(true);
      return;
    }
    
    debug.log('[LandingContent] Insert coin clicked, checking existing progress...');
    const result = await checkProgress();
    
    debug.log('[LandingContent] Progress check result:', result);
    
    // Both 'none' (new user) and 'fortune' (completed and reset) go to token-check
    // 'cards' is handled by checkProgress directly (goes to triptych-display)
    if (result === 'none' || result === 'fortune') {
      debug.log('[LandingContent] Sending to token-check:', result === 'fortune' ? 'reset' : 'new user');
      setCurrentStep('token-check');
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="w-[1200px] h-[666px] relative flex items-center justify-center">
          {/* Top Right - Connect Wallet Button */}
          <div className="absolute top-16 right-16 z-30 inline-flex items-center gap-2">
            {isConnected && (
              <p className="text-white/40 font-mono !text-xs">connected:</p>
            )}
            <WalletButton
              externalOpen={forceWalletOpen}
              onRequestClose={() => setForceWalletOpen(false)}
            />
          </div>

          {/* Bottom Left - What is this? Button */}
          <div className="absolute bottom-16 left-16 z-30">
            <button
              onClick={() => setShowInfoModal(true)}
              className="px-4 py-2 border border-white/60 text-white text-sm hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm jacquard-12"
            >
              <span className="larger">what is this ?</span>
            </button>
          </div>

          {/* Bottom Right - My Readings (only when connected) */}
          {isConnected && (
            <div className="absolute bottom-16 right-16 z-30">
              <Link
                href="/my-readings"
                className="text-white/70 hover:text-white transition-colors jacquard-12"
              >
                <span className="larger">view my past readings</span>
              </Link>
            </div>
          )}

          {/* Centered Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {/* Logo */}
            <div className="mb-[1em]">
              <Image
                src="/images/logo.png"
                alt="Umbra The Great Propeth"
                width={500}
                height={250}
                style={{ width: 'auto', height: 'auto', maxWidth: '100%' }}
              />
            </div>

            {/* Blinking Insert Coin Text */}
            <button
              onClick={handleInsertCoin}
              className="text-6xl font-bold transition-all duration-500 cursor-pointer text-white jacquard-12"
              style={{
                animation: 'blink 2s infinite',
                marginTop: '2.5em',
              }}
            >
              <span className="largest">Insert Coin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      <ModalFrame isOpen={showInfoModal} onClose={() => setShowInfoModal(false)}>
        <div className="flex gap-8 min-h-[580px] max-w-2xl mx-auto">
          {/* Left column - icons at bottom */}
          <div className="flex-shrink-0 w-[200px] flex flex-col justify-end !pl-20 !mb-4">
            <img src="/images/about.svg" alt="" className="w-[100px] h-auto brightness-0 invert" />
          </div>

          {/* Right column - all left-justified */}
          <div className="flex-1 text-left">
            {/* Logo image instead of text */}
            <img src="/images/logo.png" alt="The Great Propeth" className="h-38 mb-4" />

            {/* Subtitle - Jacquard, large */}
            <p className="!text-5xl jacquard-12 !py-6">The Path of Revelation</p>

            {/* Intro - larger */}
            <p className="!text-2xl !mb-5 opacity-90">
              Step into the unknown with The Great Propeth - an ancient entity
              that has whispered truths about your fate.
            </p>

            {/* 3 Sections - larger text */}
            <div className="space-y-6">
              <div>
                <h3 className="!text-3xl jacquard-12 !mb-2">1. The Offering</h3>
                <p className="!text-2xl opacity-80 !mb-4">
                  Burn A Promise to awaken the machine,
                  or pay 0.03 of your Ether in tribute.
                </p>
              </div>
              <div>
                <h3 className="!text-3xl jacquard-12 !mb-2">2. The Oracle</h3>
                <p className="!text-2xl opacity-80 !mb-4">
                  The Great Propeth will summon three Arcana cards
                  to reveal fragments of your destiny.
                </p>
              </div>
              <div>
                <h3 className="!text-3xl jacquard-12 !mb-2">3. The Final Revelation</h3>
                <p className="!text-2xl opacity-80 !mb-4">
                  Receive the fourth and final card
                  your complete prophecy forever written on-chain
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalFrame>
    </>
  );
}
