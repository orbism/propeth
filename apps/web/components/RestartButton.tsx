'use client';

import { useAppStore } from '@/lib/store';

export function RestartButton() {
  const reset = useAppStore((state) => state.reset);

  return (
    <button
      onClick={reset}
      className="!text-3xl px-8 py-3 border border-white hover:bg-white hover:text-black transition-colors jacquard-12"
    >
      start over
    </button>
  );
}