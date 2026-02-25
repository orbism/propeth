'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useUserFortunes } from '@/lib/hooks/useUserFortunes';
import { ReadingCard } from '@/components/ReadingCard';
import { UnfinishedReadingCard } from '@/components/UnfinishedReadingCard';
import { WalletButton } from '@/components/WalletButton';

export default function MyReadingsPage() {
  const { isConnected } = useAccount();
  const { fortunes, unfinishedReading, isLoading, hasReadings, hasUnfinishedReading } = useUserFortunes();

  // Check if there's any content to show
  const hasAnyContent = hasReadings || hasUnfinishedReading;

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
      <div className="absolute inset-0 bg-black/70 z-10" />

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col px-[6em] pt-[8em] pb-[5em]">
        {/* Header */}
        <div className="flex justify-between items-start !m-4 px-4 pt-2">
          <Link
            href="/"
            className="text-white/70 hover:text-white transition-colors jacquard-12 text-2xl"
          >
            &larr; back to fortune teller
          </Link>
          {isConnected && (
            <div className="text-right">
              <div className="text-white/40 font-mono mb-1 !text-xs inline-flex items-center gap-2">
                connected: <WalletButton />
              </div>            
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col text-center">
          {/* Title */}
          <h1 className="text-5xl jacquard-12 mb-8">
            Your Past Readings
          </h1>

          {/* Not Connected State */}
          {!isConnected && (
            <div className="py-16">
              <p className="text-2xl text-white/70 mb-8 jacquard-12">
                Connect your wallet to view your readings
              </p>
              <WalletButton />
            </div>
          )}

          {/* Loading State */}
          {isConnected && isLoading && (
            <div className="py-16">
              <div className="text-4xl mb-4 animate-spin inline-block">&#8635;</div>
              <p className="text-xl text-white/70 jacquard-12">
                Consulting the oracles...
              </p>
            </div>
          )}

          {/* No Content State */}
          {isConnected && !isLoading && !hasAnyContent && (
            <div className="py-16">
              <Link href="/" className="group inline-block">
                <p className="text-2xl text-white/70 hover:text-white transition-colors jacquard-12 cursor-pointer">
                  You have not received a reading yet.
                </p>
                <p className="text-lg text-white/40 group-hover:text-white/60 transition-colors mt-4">
                  click here to receive your fortune
                </p>
              </Link>
            </div>
          )}

          {/* Content Area */}
          {isConnected && !isLoading && hasAnyContent && (
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
              {/* Unfinished Reading - Show at top */}
              {hasUnfinishedReading && unfinishedReading && (
                <UnfinishedReadingCard cardIds={unfinishedReading.cardIds} />
              )}

              {/* Completed Readings */}
              {fortunes.map((fortune, index) => (
                <ReadingCard
                  key={fortune.tokenId}
                  tokenId={fortune.tokenId}
                  cardIds={fortune.cardIds}
                  index={fortunes.length - index - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
