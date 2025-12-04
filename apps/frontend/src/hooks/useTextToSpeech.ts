'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface UseTTSOptions {
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: string) => void;
}

interface UseTTSResult {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
}

export function useTextToSpeech(options: UseTTSOptions = {}): UseTTSResult {
  const { settings } = useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(settings.ttsSpeed);
  const [pitch, setPitch] = useState(1);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Initialize speech synthesis
  useEffect(() => {
    if (!isSupported) return;

    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synthRef.current?.getVoices() || [];
      // Prefer Italian voices
      const italianVoices = availableVoices.filter((v) => v.lang.startsWith('it'));
      setVoices(italianVoices.length > 0 ? italianVoices : availableVoices);

      // Set default voice
      if (!currentVoice && italianVoices.length > 0) {
        setCurrentVoice(italianVoices[0]);
      }
    };

    loadVoices();
    synthRef.current.onvoiceschanged = loadVoices;

    return () => {
      synthRef.current?.cancel();
    };
  }, [isSupported]);

  // Update rate from settings
  useEffect(() => {
    setRate(settings.ttsSpeed);
  }, [settings.ttsSpeed]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !synthRef.current || !settings.textToSpeech) return;

      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = 'it-IT';

      if (currentVoice) {
        utterance.voice = currentVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        options.onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        options.onEnd?.();
      };

      utterance.onpause = () => {
        setIsPaused(true);
        options.onPause?.();
      };

      utterance.onresume = () => {
        setIsPaused(false);
        options.onResume?.();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        setIsPaused(false);
        options.onError?.(event.error);
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    [isSupported, settings.textToSpeech, rate, pitch, currentVoice, options]
  );

  const pause = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setCurrentVoice(voice);
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    currentVoice,
    setVoice,
    rate,
    setRate,
    pitch,
    setPitch,
  };
}

// Hook for reading a sequence of texts
interface UseSequentialTTSOptions {
  texts: string[];
  onComplete?: () => void;
  delayBetween?: number; // ms
}

export function useSequentialTTS({
  texts,
  onComplete,
  delayBetween = 500,
}: UseSequentialTTSOptions) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const tts = useTextToSpeech({
    onEnd: () => {
      if (currentIndex < texts.length - 1) {
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, delayBetween);
      } else {
        setIsPlaying(false);
        setCurrentIndex(-1);
        onComplete?.();
      }
    },
  });

  // Speak when index changes
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < texts.length && isPlaying) {
      tts.speak(texts[currentIndex]);
    }
  }, [currentIndex, isPlaying, texts]);

  const play = useCallback(() => {
    setIsPlaying(true);
    setCurrentIndex(0);
  }, []);

  const stop = useCallback(() => {
    tts.stop();
    setIsPlaying(false);
    setCurrentIndex(-1);
  }, [tts]);

  const skip = useCallback(() => {
    if (currentIndex < texts.length - 1) {
      tts.stop();
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, texts.length, tts]);

  const previous = useCallback(() => {
    if (currentIndex > 0) {
      tts.stop();
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, tts]);

  return {
    play,
    stop,
    skip,
    previous,
    isPlaying,
    currentIndex,
    totalItems: texts.length,
    progress: texts.length > 0 ? ((currentIndex + 1) / texts.length) * 100 : 0,
  };
}

// Speak button component
import React from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface SpeakButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
}

export function SpeakButton({
  text,
  className = '',
  size = 'md',
  variant = 'icon',
}: SpeakButtonProps) {
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();
  const { settings } = useAccessibility();

  if (!isSupported || !settings.textToSpeech) {
    return null;
  }

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`rounded-full hover:bg-gray-100 transition-colors ${sizeClasses[size]} ${className}`}
        title={isSpeaking ? 'Ferma lettura' : 'Leggi ad alta voce'}
        aria-label={isSpeaking ? 'Ferma lettura' : 'Leggi ad alta voce'}
      >
        {isSpeaking ? (
          <VolumeX className={`${iconSizes[size]} text-primary-600`} />
        ) : (
          <Volume2 className={`${iconSizes[size]} text-gray-600`} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
        ${isSpeaking ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
        ${className}
      `}
    >
      {isSpeaking ? (
        <>
          <VolumeX className={iconSizes[size]} />
          <span className="text-sm">Ferma</span>
        </>
      ) : (
        <>
          <Volume2 className={iconSizes[size]} />
          <span className="text-sm">Ascolta</span>
        </>
      )}
    </button>
  );
}
