'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  playSound as playSoundFn,
  setSoundEnabled,
  setSoundVolume,
  isSoundEnabled,
  getSoundVolume,
  type SoundType,
} from '../lib/sounds';

interface SoundContextValue {
  enabled: boolean;
  volume: number;
  toggleSound: () => void;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(true);
  const [volume, setVolumeState] = useState(0.5);

  // Sync with localStorage on mount
  useEffect(() => {
    setEnabledState(isSoundEnabled());
    setVolumeState(getSoundVolume());
  }, []);

  const toggleSound = useCallback(() => {
    const newEnabled = !enabled;
    setEnabledState(newEnabled);
    setSoundEnabled(newEnabled);
    if (newEnabled) {
      playSoundFn('click');
    }
  }, [enabled]);

  const setEnabled = useCallback((newEnabled: boolean) => {
    setEnabledState(newEnabled);
    setSoundEnabled(newEnabled);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    setSoundVolume(newVolume);
  }, []);

  const playSound = useCallback((type: SoundType) => {
    playSoundFn(type);
  }, []);

  return (
    <SoundContext.Provider
      value={{
        enabled,
        volume,
        toggleSound,
        setEnabled,
        setVolume,
        playSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}

// Custom hook for interactive elements with sound
export function useInteractiveSound() {
  const { playSound } = useSound();

  const onHover = useCallback(() => {
    playSound('hover');
  }, [playSound]);

  const onClick = useCallback(() => {
    playSound('click');
  }, [playSound]);

  return { onHover, onClick };
}
