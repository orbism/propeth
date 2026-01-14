'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { WalletButton } from './WalletButton';
import { ModalFrame } from '@/components/ui/ModalFrame';
import Image from 'next/image';

interface LandingPageProps {
  onInsertCoin: () => void;
}

export function LandingPage({ onInsertCoin }: LandingPageProps) {
  const { isConnected } = useAccount();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [forceWalletOpen, setForceWalletOpen] = useState(false);

  const handleInsertCoin = () => {
    if (!isConnected) {
      // Prompt wallet selection modal explicitly
      setForceWalletOpen(true);
      return;
    }
    onInsertCoin();
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Video */}
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

      {/* Content Area - Exactly 1200px x 666px, vertically centered in viewport */}
      <div className="relative z-20 flex items-center justify-center p-8 h-screen">
        <div className="w-[1200px] h-[666px] relative flex items-center justify-center">
          {/* Decorative Frame Corners - fills entire 1200x666 container */}
          <div className="absolute inset-0 pointer-events-none ">
            <Image
              src="/images/frame_tl.png"
              alt=""
              width={200}
              height={200}
              className="absolute top-0 left-0"
              style={{ width: 'auto', height: 'auto' }}
            />
            <Image
              src="/images/frame_tr.png"
              alt=""
              width={200}
              height={200}
              className="absolute top-0 right-0"
              style={{ width: 'auto', height: 'auto' }}
            />
            <Image
              src="/images/frame_bl.png"
              alt=""
              width={200}
              height={200}
              className="absolute bottom-0 left-0"
              style={{ width: 'auto', height: 'auto' }}
            />
            <Image
              src="/images/frame_br.png"
              alt=""
              width={200}
              height={200}
              className="absolute bottom-0 right-0"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>

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
                style={{ width: 'auto', height: 'auto', maxWidth: '100%' }}
              />
            </div>

            {/* Blinking Insert Coin Text - Always blinking */}
            <button
              onClick={handleInsertCoin}
              className="text-6xl font-bold transition-all duration-500  cursor-pointer text-white jacquard-12"
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
        <h2 className="text-4xl font-bold mb-12 text-center">About The Great Propeth</h2>
        <div className="text-xl space-y-8 text-left leading-relaxed px-4">
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
          <p className="text-lg opacity-70 mt-12 text-right">
            Built on Ethereum. Powered by mysticism and mathematics.
          </p>
        </div>
      </ModalFrame>
    </div>
  );
}
