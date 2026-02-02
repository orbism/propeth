'use client';

import { PACK1155_ADDRESS, FORTUNE721_ADDRESS } from '@/lib/contracts';

export function Footer() {
  return (
    <div className="fixed bottom-4 left-4 z-30 text-sm text-white/40">
      <span>Art: </span>
      <a href="https://x.com/Bezmiar1" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">Bezmiar</a>
      <span> | Dev: </span>
      <a href="https://x.com/ArtOfOrb" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">orb</a>
      <span> | </span>
      <a href={`https://etherscan.io/address/${PACK1155_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">1155 Contract</a>
      <span> | </span>
      <a href={`https://etherscan.io/address/${FORTUNE721_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">721 Contract</a>
      <span> | </span>
      {/* <a href={`https://opensea.io/assets/ethereum/${PACK1155_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">Fortune Cards</a>
      <span> | </span>
      <a href={`https://opensea.io/assets/ethereum/${FORTUNE721_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">Fate Cards</a> */}
    </div>
  );
}
