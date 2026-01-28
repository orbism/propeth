'use client';

import Image from 'next/image';

interface MintLoaderProps {
  status: 'pending' | 'confirming' | 'success' | 'error';
  txHash?: `0x${string}`;
  error?: Error | null;
  message?: string;
  onClose?: () => void;
  onRetry?: () => void;
}

export function MintLoader({ status, txHash, error, message, onClose, onRetry }: MintLoaderProps) {
  const chainId = typeof window !== 'undefined' ?
    (window as any).ethereum?.chainId : null;
  const isLocal = chainId === '0x539';

  // Detect user rejection errors
  const isUserRejection = error?.message?.toLowerCase().includes('user denied') ||
    error?.message?.toLowerCase().includes('user rejected') ||
    error?.message?.toLowerCase().includes('rejected the request');

  // Detect insufficient funds errors
  const isInsufficientFunds = error?.message?.toLowerCase().includes('insufficient funds');

  return (
    <div className="text-center min-h-[400px] flex flex-col items-center justify-center">
      {status === 'pending' && (
        <>
          <Image
            src="/images/loader.gif"
            alt="Loading..."
            width={120}
            height={120}
            unoptimized
            className="mb-6"
          />
          <p className="text-3xl font-bold mb-2">{message || 'Awaiting Signature...'}</p>
          <p className="text-lg text-gray-400">Check your wallet extension</p>
        </>
      )}

      {status === 'confirming' && (
        <>
          <Image
            src="/images/loader.gif"
            alt="Confirming..."
            width={120}
            height={120}
            unoptimized
            className="mb-6"
          />
          <p className="text-3xl font-bold mb-2">{message || 'Confirming Transaction...'}</p>
          <p className="text-lg text-gray-400 mb-4">This may take a moment</p>
          {txHash && !isLocal && (
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white underline"
            >
              View on Etherscan
            </a>
          )}
          {isLocal && (
            <p className="text-sm text-gray-400">Transaction pending on local chain...</p>
          )}
        </>
      )}

      {status === 'success' && (
        <>
          <div className="text-8xl mb-6">✓</div>
          <p className="text-3xl font-bold">Success!</p>
          <p className="text-lg text-gray-400 mt-4">Transaction confirmed</p>
        </>
      )}

      {status === 'error' && (
        <>
          {isUserRejection ? (
            <>
              <p className="text-3xl block relative !mb-8 !mt-3">
                Did you change your mind?
                <br />
                Your fortune still awaits you...
              </p>
              {(onRetry || onClose) && (
                <button
                  onClick={onRetry || onClose}
                  className="mt-6 px-8 py-3 text-4xl border-2 border-white text-white hover:bg-white hover:text-black transition-all jacquard-12"
                >
                  Try Again
                </button>
              )}
            </>
          ) : isInsufficientFunds ? (
            <>
              <p className="text-3xl block relative !mb-8 !mt-3">
                There is nothing shameful in having no coins.
                <br />
                You can always come back later.
              </p>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-[10rem] leading-none hover:scale-110 transition-transform cursor-pointer"
                  aria-label="Return to start"
                >
                  ☜
                </button>
              )}
            </>
          ) : (
            <>
              <div className="text-8xl mb-6 text-red-500">✕</div>
              <p className="text-3xl font-bold mb-4">Transaction Failed</p>
              {error && (
                <p className="text-sm text-red-400 mt-2 max-w-sm break-words mb-6">
                  {error.message}
                </p>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="mt-6 px-8 py-3 text-4xl border-2 border-white text-white hover:bg-white hover:text-black transition-all jacquard-12"
                >
                  Try Again
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
