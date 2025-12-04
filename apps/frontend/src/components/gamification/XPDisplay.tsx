'use client';

import { useState, useEffect } from 'react';
import { Star, TrendingUp, Zap, ArrowUp } from 'lucide-react';

interface XPDisplayProps {
  totalXP: number;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function XPDisplay({
  totalXP,
  level,
  currentXP,
  nextLevelXP,
  progress,
  showDetails = true,
  size = 'md',
}: XPDisplayProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const sizeConfig = {
    sm: {
      container: 'p-3',
      levelSize: 'w-10 h-10 text-lg',
      barHeight: 'h-2',
      textSize: 'text-sm',
    },
    md: {
      container: 'p-4',
      levelSize: 'w-14 h-14 text-xl',
      barHeight: 'h-3',
      textSize: 'text-base',
    },
    lg: {
      container: 'p-6',
      levelSize: 'w-20 h-20 text-3xl',
      barHeight: 'h-4',
      textSize: 'text-lg',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`bg-white rounded-xl shadow-sm ${config.container}`}>
      <div className="flex items-center gap-4">
        {/* Level Circle */}
        <div className="relative">
          <div
            className={`${config.levelSize} rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center font-bold text-white shadow-lg`}
          >
            {level}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
            <Star className="h-3 w-3 text-yellow-800" />
          </div>
        </div>

        {/* XP Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-semibold text-gray-900 ${config.textSize}`}>
              Livello {level}
            </span>
            <span className="text-sm text-gray-500">
              {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
            </span>
          </div>

          {/* Progress Bar */}
          <div className={`${config.barHeight} bg-gray-200 rounded-full overflow-hidden`}>
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-1000 ease-out"
              style={{ width: `${animatedProgress}%` }}
            />
          </div>

          {showDetails && (
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-gray-500">
                {Math.round(progress)}% al prossimo livello
              </span>
              <span className="text-purple-600 font-medium">
                {totalXP.toLocaleString()} XP totali
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface XPGainAnimationProps {
  amount: number;
  onComplete?: () => void;
}

export function XPGainAnimation({ amount, onComplete }: XPGainAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className="animate-xp-gain flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-full shadow-xl">
        <Star className="h-6 w-6" />
        <span className="text-2xl font-bold">+{amount} XP</span>
      </div>

      <style jsx global>{`
        @keyframes xp-gain {
          0% {
            transform: scale(0.5) translateY(0);
            opacity: 0;
          }
          20% {
            transform: scale(1.2) translateY(0);
            opacity: 1;
          }
          40% {
            transform: scale(1) translateY(0);
          }
          80% {
            transform: scale(1) translateY(-20px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(-40px);
            opacity: 0;
          }
        }
        .animate-xp-gain {
          animation: xp-gain 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

interface LevelUpAnimationProps {
  newLevel: number;
  onComplete?: () => void;
}

export function LevelUpAnimation({ newLevel, onComplete }: LevelUpAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="text-center animate-level-up">
        <div className="mb-4">
          <ArrowUp className="h-16 w-16 text-yellow-400 mx-auto animate-bounce" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">LIVELLO SU!</h2>
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/50">
          <span className="text-6xl font-bold text-white">{newLevel}</span>
        </div>
        <p className="text-xl text-yellow-200 mt-4">
          Hai raggiunto il livello {newLevel}!
        </p>
      </div>

      <style jsx global>{`
        @keyframes level-up {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-level-up {
          animation: level-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

interface RecentXPProps {
  rewards: { amount: number; source: string; createdAt: Date }[];
}

const SOURCE_LABELS: Record<string, string> = {
  game: 'Gioco',
  quiz: 'Quiz',
  lesson: 'Lezione',
  badge: 'Badge',
  daily: 'Bonus Giornaliero',
  streak: 'Serie Risposte',
  first_place: 'Primo Posto',
};

export function RecentXP({ rewards }: RecentXPProps) {
  if (rewards.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nessun XP recente</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rewards.map((reward, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {SOURCE_LABELS[reward.source] || reward.source}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(reward.createdAt).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <span className="text-green-600 font-semibold">+{reward.amount} XP</span>
        </div>
      ))}
    </div>
  );
}

interface XPProgressCardProps {
  stats: {
    level: number;
    totalXP: number;
    currentXP: number;
    nextLevelXP: number;
    progress: number;
    recentXP: { amount: number; source: string; createdAt: Date }[];
  };
}

export function XPProgressCard({ stats }: XPProgressCardProps) {
  const [showRecent, setShowRecent] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <XPDisplay
          level={stats.level}
          totalXP={stats.totalXP}
          currentXP={stats.currentXP}
          nextLevelXP={stats.nextLevelXP}
          progress={stats.progress}
          size="lg"
        />
      </div>

      <div className="border-t">
        <button
          onClick={() => setShowRecent(!showRecent)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            XP Recenti
          </span>
          <span className="text-gray-400">{showRecent ? '−' : '+'}</span>
        </button>

        {showRecent && (
          <div className="px-6 pb-4">
            <RecentXP rewards={stats.recentXP} />
          </div>
        )}
      </div>
    </div>
  );
}
