'use client';

import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'music-player-muted';

export function MusicPlayer() {
  const [isMuted, setIsMuted] = useState(false);
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // On first interaction, ALWAYS play (ignore localStorage)
  // After that, mute/play button controls state and saves to localStorage
  useEffect(() => {
    if (hasUnlocked) return;

    const handleInteraction = () => {
      if (!audioRef.current) return;

      audioRef.current.muted = false;
      audioRef.current.currentTime = 0.06;
      audioRef.current.play().then(() => {
        setIsMuted(false);
        setHasUnlocked(true);
      }).catch(() => {
        setIsMuted(true);
        setHasUnlocked(true);
      });

      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [hasUnlocked]);

  // Handle mute/unmute changes (after initial unlock)
  useEffect(() => {
    if (!hasUnlocked || !audioRef.current) return;

    if (isMuted) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [isMuted, hasUnlocked]);
  

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem(STORAGE_KEY, String(newMuted));
    // Immediately control audio for responsive feedback
    if (audioRef.current) {
      if (newMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <audio ref={audioRef} src="/audiio/knightxd.mp3" loop playsInline />
      <button
        onClick={toggleMute}
        className="w-16 h-16 cursor-pointer bg-transparent border-none p-0 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        aria-label={isMuted ? 'Play music' : 'Mute music'}
      >
        <img
          key={isMuted ? 'play' : 'mute'}
          src={isMuted ? '/audiio/play.svg' : '/audiio/mute.svg'}
          alt={isMuted ? 'Play' : 'Mute'}
          className="w-full h-full invert"
        />
      </button>
    </div>
  );
}
