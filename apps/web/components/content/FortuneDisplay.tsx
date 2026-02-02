'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FortuneCard } from '../FortuneCard';
import { RestartButton } from '../RestartButton';
import { useAppStore } from '@/lib/store';
import { FORTUNE721_ADDRESS } from '@/lib/contracts';

interface FortuneDisplayProps {
  tokenId: string;
}

export function FortuneDisplay({ tokenId }: FortuneDisplayProps) {
  const { setCurrentStep } = useAppStore();
  const [svgString, setSvgString] = useState<string>('');

  const handleBackToFate = () => {
    setCurrentStep('triptych-display');
  };

  const handleDownloadPng = async () => {
    if (!svgString) return;

    try {
      // Find the external image URL in the SVG
      const imageMatch = svgString.match(/<image\s+href="([^"]+)"/);
      let processedSvg = svgString;

      if (imageMatch) {
        const imageUrl = imageMatch[1];
        // Extract CID from IPFS URL and use our proxy to avoid CORS
        const cidMatch = imageUrl.match(/ipfs\/(.+)$/);
        const fetchUrl = cidMatch ? `/api/ipfs/${cidMatch[1]}` : imageUrl;

        // Fetch the background image and convert to base64
        const response = await fetch(fetchUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        // Replace the external URL with embedded base64
        processedSvg = svgString.replace(imageUrl, base64);
      }

      // Create blob URL from processed SVG
      const svgBlob = new Blob([processedSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Use native SVG dimensions (1920x1080)
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, 1920, 1080);

        const link = document.createElement('a');
        link.download = `fortune-${tokenId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (error) {
      console.error('Failed to download PNG:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-6xl w-full">
        {/* Fortune Card - Significantly Larger */}
        <div className="!-mt-10 text-center">
          <FortuneCard tokenId={tokenId} onSvgReady={(_, svg) => setSvgString(svg)} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-12 !mb-3 !mt-3">
          <a
            href={`https://opensea.io/assets/ethereum/${FORTUNE721_ADDRESS}/${tokenId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="!px-8 !py-2 !bg-[#f5f0e1] !text-black border-2 border-[#f5f0e1] hover:!bg-black hover:!text-[#f5f0e1] hover:border-[#f5f0e1] transition-all jacquard-12 !text-2xl"
          >
            View on OpenSea
          </a>
          <button
            onClick={handleDownloadPng}
            className="!px-8 !py-2 !bg-[#f5f0e1] !text-black !border-2 border-[#f5f0e1] hover:!bg-black hover:!text-[#f5f0e1] hover:border-[#f5f0e1] transition-all jacquard-12 !text-2xl"
          >
            Download as PNG
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleBackToFate}
            className="px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-black transition-all jacquard-12 !text-2xl"
          >
            go back to fate cards
          </button>
          <span className="!text-xl">or</span>
          <RestartButton />
        </div>

        {/* View Past Readings Link */}
        <div className="flex justify-center mt-6">
          <Link
            href="/my-readings"
            className="text-white/60 hover:text-white transition-colors jacquard-12 text-2xl jersey-10"
          >
            alternatively, view all of your past visits with The Great Propeth &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
