'use client';

interface CTAButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function CTAButton({ onClick, disabled }: CTAButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-12 py-6 text-2xl font-bold border-2 border-white hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      TELL ME MY FUTURE
    </button>
  );
}