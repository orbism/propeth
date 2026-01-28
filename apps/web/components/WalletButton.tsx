'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react';
import { ModalFrame } from '@/components/ui/ModalFrame';

interface WalletButtonProps {
  externalOpen?: boolean;
  onRequestClose?: () => void;
}

export function WalletButton({ externalOpen = false, onRequestClose }: WalletButtonProps) {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);

  const handleConnect = (connector: typeof connectors[0]) => {
    connect({ connector });
    setShowModal(false);
  };

  // Respond to external open requests
  useEffect(() => {
    if (externalOpen) setShowModal(true);
  }, [externalOpen]);

  const closeModal = () => {
    setShowModal(false);
    onRequestClose?.();
  };

  if (isConnected && address) {
    return (
      <div className="text-white text-sm backdrop-blur-sm jersey-10 larger">
        {address.slice(0, 6)}...{address.slice(-4)}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm jersey-10"
      >
        <span className="larger">Connect wallet</span>
      </button>

      <ModalFrame isOpen={showModal} onClose={closeModal}>
        <h2 className="text-5xl font-bold !mb-8 jacquard-12 text-center">Choose a Wallet</h2>
        <div className="space-y-6 text-2xl">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => handleConnect(connector)}
              className="w-full px-8 py-6 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 text-center jersey-10 !text-4xl"
            >
              {connector.name}
            </button>
          ))}
        </div>
      </ModalFrame>
    </>
  );
}