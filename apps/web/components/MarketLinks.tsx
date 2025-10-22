'use client';

interface MarketLinksProps {
  collectionAddress: string;
  tokenId?: bigint;
}

export function MarketLinks({ collectionAddress, tokenId }: MarketLinksProps) {
  const openSeaUrl = tokenId
    ? `https://opensea.io/assets/ethereum/${collectionAddress}/${tokenId}`
    : `https://opensea.io/collection/${collectionAddress}`;

  const magicEdenUrl = tokenId
    ? `https://magiceden.io/item-details/ethereum/${collectionAddress}/${tokenId}`
    : `https://magiceden.io/collections/ethereum/${collectionAddress}`;

  return (
    <div className="flex gap-4 justify-center">
      <a
        href={openSeaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 border border-white hover:bg-white hover:text-black transition-colors"
      >
        OpenSea
      </a>
      <a
        href={magicEdenUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 border border-white hover:bg-white hover:text-black transition-colors"
      >
        Magic Eden
      </a>
    </div>
  );
}