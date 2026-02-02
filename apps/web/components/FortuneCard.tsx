'use client';

import { useState, useEffect } from 'react';

interface FortuneCardProps {
  tokenId: string;
  onSvgReady?: (svgUrl: string, svgString: string) => void;
}

export function FortuneCard({ tokenId, onSvgReady }: FortuneCardProps) {
  const [svgDataUrl, setSvgDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSVG = async () => {
      try {
        const response = await fetch(`/api/fortune/${tokenId}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.svg) {
          throw new Error('No SVG data in response');
        }
        
        // Create a data URL from SVG string
        const blob = new Blob([data.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        setSvgDataUrl(url);
        onSvgReady?.(url, data.svg);
      } catch (error) {
        console.error('Failed to fetch fortune SVG:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSVG();
  }, [tokenId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-96">
        <div className="text-white text-2xl">Loading your fortune...</div>
      </div>
    );
  }

  return (
    <>
      {/* SVG Display - Significantly Larger */}
      {svgDataUrl && (
        <div className="flex justify-center !mt-20">
          <div className="border-2 border-black" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <object
              data={svgDataUrl}
              type="image/svg+xml"
              style={{ display: 'block', width: '620px', height: 'auto' }}
            />
          </div>
        </div>
      )}
      
      {/* Spacing and content below */}
      <div className="mt-8 w-full">
        {/* Content will be rendered by FortuneDisplay */}
      </div>
    </>
  );
}