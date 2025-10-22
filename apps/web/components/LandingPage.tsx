'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { WalletButton } from './WalletButton';
import Image from 'next/image';

interface LandingPageProps {
  onInsertCoin: () => void;
}

export function LandingPage({ onInsertCoin }: LandingPageProps) {
  const { isConnected } = useAccount();
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleInsertCoin = () => {
    if (!isConnected) {
      // Insert Coin button should not trigger wallet connection directly
      // User needs to click Connect Wallet button first
      return;
    } else {
      // If wallet connected, proceed with Promise check flow
      onInsertCoin();
    }
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

          {/* Top Right - Connect Wallet Button */}
          <div className="absolute top-16 right-16 z-30">
            <WalletButton />
          </div>

          {/* Bottom Left - What is this? Button */}
          <div className="absolute bottom-16 left-16 z-30">
            <button
              onClick={() => setShowInfoModal(true)}
              className="px-4 py-2 border border-white/60 text-white text-sm hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm"
            >
              what is this ?
            </button>
          </div>

          {/* Centered Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {/* Logo */}
            <div className="mb-16">
              <Image
                src="/images/logo.png"
                alt="Umbra The Great Propeth"
                width={400}
                height={200}
                className="max-w-full h-auto"
              />
            </div>

            {/* Blinking Insert Coin Text - Always blinking */}
            <button
              onClick={handleInsertCoin}
              className="text-3xl font-bold transition-all duration-500 hover:scale-110 cursor-pointer text-white"
              style={{
                animation: 'blink 0.55s infinite',
              }}
            >
              Insert Coin
            </button>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8">
          <div className="max-w-[1200px] w-full h-full relative flex items-center justify-center">
            {/* Modal Background */}
            <div className="bg-black/80 border-2 border-white p-8 max-w-2xl w-full relative">
              {/* Modal Corner Frames */}
              <div className="absolute inset-0 pointer-events-none">
                <Image
                  src="/images/frame_tl.png"
                  alt=""
                  width={100}
                  height={100}
                  className="absolute top-0 left-0"
                />
                <Image
                  src="/images/frame_tr.png"
                  alt=""
                  width={100}
                  height={100}
                  className="absolute top-0 right-0"
                />
                <Image
                  src="/images/frame_bl.png"
                  alt=""
                  width={100}
                  height={100}
                  className="absolute bottom-0 left-0"
                />
                <Image
                  src="/images/frame_br.png"
                  alt=""
                  width={100}
                  height={100}
                  className="absolute bottom-0 right-0"
                />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 text-3xl hover:opacity-70 z-10"
              >
                ×
              </button>

              {/* Modal Content */}
              <div className="relative z-10 text-center pt-8">
                <h2 className="text-3xl font-bold mb-6">About The Great Propeth</h2>
                <div className="text-lg space-y-4 text-left max-w-xl mx-auto">
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
                  <p className="text-sm opacity-70 mt-6">
                    Built on Ethereum. Powered by mysticism and mathematics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
