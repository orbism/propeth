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
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 bg-white text-black border border-black hover:bg-black hover:text-white transition-colors"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-black text-white border border-black hover:bg-white hover:text-black transition-colors"
      >
        Connect Wallet
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-sm w-full mx-4 border-2 border-black">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Connect Wallet</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl hover:opacity-70"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => handleConnect(connector)}
                  className="w-full px-4 py-3 border border-black hover:bg-black hover:text-white transition-colors text-left"
                >
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}