'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);

  const handleConnect = (connector: typeof connectors[0]) => {
    connect({ connector });
    setShowModal(false);
  };

  if (isConnected && address) {
    return (
      <div className="px-4 py-2 border border-white/60 text-white text-sm backdrop-blur-sm">
        {address.slice(0, 6)}...{address.slice(-4)}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm"
      >
        Connect wallet
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8">
          <div className="bg-black border-4 border-white p-8 max-w-md w-full relative">
            {/* Modal Corner Frames */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-white/60"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-white/60"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-white/60"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-white/60"></div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-3xl text-white hover:opacity-70"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => handleConnect(connector)}
                    className="w-full px-6 py-4 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 text-left"
                  >
                    {connector.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}