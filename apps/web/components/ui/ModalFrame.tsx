'use client';

import Image from 'next/image';

interface ModalFrameProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export function ModalFrame({ isOpen, onClose, children }: ModalFrameProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-transparent max-w-md w-full relative" style={{ padding: '3em' }}>
        {/* Modal Corner Frames */}
        <div className="absolute inset-0 pointer-events-none backdrop-blur-sm">
          <Image src="/images/frame_tl.png" alt="" width={100} height={100} className="absolute top-0 left-0" />
          <Image src="/images/frame_tr.png" alt="" width={100} height={100} className="absolute top-0 right-0" />
          <Image src="/images/frame_bl.png" alt="" width={100} height={100} className="absolute bottom-0 left-0" />
          <Image src="/images/frame_br.png" alt="" width={100} height={100} className="absolute bottom-0 right-0" />
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 text-6xl text-white hover:opacity-70 z-50"
            aria-label="Close"
          >
            <span className="largest">x</span>
          </button>
        )}

        <div className="relative z-10 px-8 py-8 text-white jacquard-12">{children}</div>
      </div>
    </div>
  );
}


