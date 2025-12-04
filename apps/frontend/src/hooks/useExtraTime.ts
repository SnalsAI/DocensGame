'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface UseExtraTimeOptions {
  baseTime: number; // Base time in seconds
  onTimeUp?: () => void;
  autoStart?: boolean;
}

interface UseExtraTimeResult {
  timeRemaining: number;
  totalTime: number;
  extraTimeApplied: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  addTime: (seconds: number) => void;
  progress: number; // 0-100
  formattedTime: string;
  hasDSAExtraTime: boolean;
}

export function useExtraTime({
  baseTime,
  onTimeUp,
  autoStart = false,
}: UseExtraTimeOptions): UseExtraTimeResult {
  const { settings } = useAccessibility();

  // Calculate extra time based on settings
  const extraTimeSeconds = settings.extraTime
    ? Math.round(baseTime * (settings.extraTimePercent / 100))
    : 0;

  const totalTime = baseTime + extraTimeSeconds;

  const [timeRemaining, setTimeRemaining] = useState(totalTime);
  const [isRunning, setIsRunning] = useState(autoStart);

  // Recalculate when settings change
  useEffect(() => {
    const newTotal = baseTime + (settings.extraTime
      ? Math.round(baseTime * (settings.extraTimePercent / 100))
      : 0);

    // Only update if not running or if total changed
    if (!isRunning || newTotal !== totalTime) {
      setTimeRemaining(newTotal);
    }
  }, [baseTime, settings.extraTime, settings.extraTimePercent]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, onTimeUp]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(totalTime);
    setIsRunning(false);
  }, [totalTime]);

  const addTime = useCallback((seconds: number) => {
    setTimeRemaining((prev) => prev + seconds);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    totalTime,
    extraTimeApplied: extraTimeSeconds,
    isRunning,
    start,
    pause,
    reset,
    addTime,
    progress: (timeRemaining / totalTime) * 100,
    formattedTime: formatTime(timeRemaining),
    hasDSAExtraTime: settings.extraTime && extraTimeSeconds > 0,
  };
}

// Hook to calculate game time with DSA considerations
export function useGameTime(baseTimePerQuestion: number, numQuestions: number) {
  const { settings } = useAccessibility();

  const extraTimeMultiplier = settings.extraTime
    ? 1 + settings.extraTimePercent / 100
    : 1;

  const timePerQuestion = Math.round(baseTimePerQuestion * extraTimeMultiplier);
  const totalGameTime = timePerQuestion * numQuestions;

  return {
    timePerQuestion,
    totalGameTime,
    hasExtraTime: settings.extraTime,
    extraTimePercent: settings.extraTimePercent,
    isDSAMode: settings.dsaMode,
  };
}

// Component to display extra time indicator
import React from 'react';
import { Clock, Plus } from 'lucide-react';

interface ExtraTimeIndicatorProps {
  baseTime: number;
  className?: string;
}

export function ExtraTimeIndicator({ baseTime, className = '' }: ExtraTimeIndicatorProps) {
  const { settings } = useAccessibility();

  if (!settings.extraTime) return null;

  const extraSeconds = Math.round(baseTime * (settings.extraTimePercent / 100));

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm ${className}`}
      title="Tempo extra DSA/BES applicato"
    >
      <Clock className="h-3 w-3" />
      <Plus className="h-3 w-3" />
      <span>{extraSeconds}s</span>
    </div>
  );
}

// Game timer component with DSA support
interface GameTimerProps {
  baseTime: number;
  onTimeUp: () => void;
  autoStart?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showExtraTimeIndicator?: boolean;
}

export function GameTimer({
  baseTime,
  onTimeUp,
  autoStart = true,
  size = 'md',
  showExtraTimeIndicator = true,
}: GameTimerProps) {
  const {
    timeRemaining,
    formattedTime,
    progress,
    hasDSAExtraTime,
    extraTimeApplied,
    isRunning,
  } = useExtraTime({ baseTime, onTimeUp, autoStart });

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
  };

  const isLowTime = timeRemaining <= 5;
  const isUrgent = timeRemaining <= 3;

  return (
    <div className="flex flex-col items-center">
      {/* Circular Timer */}
      <div
        className={`
          relative rounded-full flex items-center justify-center font-bold
          ${sizeClasses[size]}
          ${isUrgent ? 'bg-red-600 text-white animate-pulse' : isLowTime ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-900'}
        `}
      >
        {/* Progress ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${progress * 2.83} 283`}
            className={`
              transition-all duration-1000
              ${isUrgent ? 'text-red-300' : isLowTime ? 'text-yellow-300' : 'text-primary-500'}
            `}
          />
        </svg>

        <span className="z-10">{timeRemaining}</span>
      </div>

      {/* Extra time indicator */}
      {showExtraTimeIndicator && hasDSAExtraTime && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
          <Plus className="h-3 w-3" />
          <span>{extraTimeApplied}s extra</span>
        </div>
      )}
    </div>
  );
}
