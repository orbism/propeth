'use client';

import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'music-player-muted';

export function MusicPlayer() {
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsMuted(stored === 'true');
    }
    // Attempt autoplay on mount
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Browser blocked autoplay, show play button
        setIsMuted(true);
      });
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          setIsMuted(true);
        });
      }
    }
  }, [isMuted]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem(STORAGE_KEY, String(newMuted));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <audio ref={audioRef} src="/audiio/knightxd.mp3" loop />
      <button
        onClick={toggleMute}
        className="w-16 h-16 cursor-pointer bg-transparent border-none p-0 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        aria-label={isMuted ? 'Play music' : 'Mute music'}
      >
        <img
          src={isMuted ? '/audiio/play.svg' : '/audiio/mute.svg'}
          alt={isMuted ? 'Play' : 'Mute'}
          className="w-full h-full invert"
        />
      </button>
    </div>
  );
}
