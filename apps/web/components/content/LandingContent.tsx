'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { WalletButton } from '../WalletButton';
import { ModalFrame } from '@/components/ui/ModalFrame';
import { useAppStore } from '@/lib/store';
import { useCheckExistingProgress } from '@/lib/hooks/useCheckExistingProgress';
import Image from 'next/image';

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
    
    console.log('[LandingContent] Insert coin clicked, checking existing progress...');
    const result = await checkProgress();
    
    console.log('[LandingContent] Progress check result:', result);
    
    // Both 'none' (new user) and 'fortune' (completed and reset) go to token-check
    // 'cards' is handled by checkProgress directly (goes to triptych-display)
    if (result === 'none' || result === 'fortune') {
      console.log('[LandingContent] Sending to token-check:', result === 'fortune' ? 'reset' : 'new user');
      setCurrentStep('token-check');
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="w-[1200px] h-[666px] relative flex items-center justify-center">
          {/* Top Right - Connect Wallet Button */}
          <div className="absolute top-16 right-16 z-30">
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

          {/* Centered Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {/* Logo */}
            <div className="mb-[1em]">
              <Image
                src="/images/logo.png"
                alt="Umbra The Great Propeth"
                width={500}
                height={250}
                className="max-w-full h-auto"
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
        <h2 className="!text-5xl mb-8 !pb-2 text-center">About The Great Propeth</h2>
        <div className="font-regular text-xl !space-y-6 text-left mx-auto">
          <p>
            The Great Propeth is an ancient mystical entity that has gazed into the infinite
            void and returned with visions of what may come to pass.
          </p>
          <p>
            Through the power of the Triptych and the Final Revelation, you may glimpse
            fragments of your destiny as interpreted by The Great Propeth's infinite wisdom.
          </p>
          <p>
            Each fortune is composed of three mystical cards that form a unique narrative,
            culminating in the fourth card that reveals the complete prophecy.
          </p>
          <p className="text-xl opacity-70 mt-6 text-right">
            Built on Ethereum. Powered by mysticism and mathematics.
          </p>
        </div>
      </ModalFrame>
    </>
  );
}
