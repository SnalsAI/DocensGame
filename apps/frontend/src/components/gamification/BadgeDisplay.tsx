'use client';

import { useState } from 'react';
import {
  Star,
  Trophy,
  Zap,
  Crown,
  Medal,
  Shield,
  Sword,
  Target,
  BookOpen,
  Users,
  Clock,
  Flame,
} from 'lucide-react';

export type Badge = {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: 'LEARNING' | 'GAMING' | 'SOCIAL' | 'SPECIAL';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  xpReward: number;
  earnedAt?: Date;
};

const RARITY_CONFIG = {
  COMMON: {
    color: 'gray',
    bgClass: 'bg-gray-100 border-gray-300',
    textClass: 'text-gray-600',
    glowClass: '',
    label: 'Comune',
  },
  RARE: {
    color: 'blue',
    bgClass: 'bg-blue-100 border-blue-400',
    textClass: 'text-blue-600',
    glowClass: 'shadow-blue-500/30',
    label: 'Raro',
  },
  EPIC: {
    color: 'purple',
    bgClass: 'bg-purple-100 border-purple-500',
    textClass: 'text-purple-600',
    glowClass: 'shadow-purple-500/40',
    label: 'Epico',
  },
  LEGENDARY: {
    color: 'yellow',
    bgClass: 'bg-gradient-to-br from-yellow-100 to-amber-100 border-yellow-500',
    textClass: 'text-yellow-600',
    glowClass: 'shadow-yellow-500/50 animate-pulse',
    label: 'Leggendario',
  },
};

const CATEGORY_ICONS = {
  LEARNING: BookOpen,
  GAMING: Sword,
  SOCIAL: Users,
  SPECIAL: Star,
};

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  first_lesson: BookOpen,
  knowledge_seeker: Target,
  scholar: Medal,
  master_learner: Crown,
  quiz_ace: Zap,
  perfect_score: Trophy,
  first_victory: Trophy,
  champion: Crown,
  undefeated: Shield,
  boss_slayer: Sword,
  dungeon_master: Flame,
  speed_demon: Zap,
  streak_master: Flame,
  team_player: Users,
  class_hero: Star,
  helper: Shield,
  early_bird: Clock,
  night_owl: Clock,
  weekly_warrior: Calendar,
  comeback_kid: Star,
};

function Calendar({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
}

export function BadgeDisplay({
  badge,
  size = 'md',
  showDetails = false,
  isLocked = false,
  onClick,
}: BadgeDisplayProps) {
  const rarityConfig = RARITY_CONFIG[badge.rarity];
  const Icon = BADGE_ICONS[badge.id] || Star;

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={`relative group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div
        className={`
          ${sizeClasses[size]} rounded-xl border-2 flex items-center justify-center
          ${isLocked ? 'bg-gray-200 border-gray-300' : rarityConfig.bgClass}
          ${!isLocked && rarityConfig.glowClass ? `shadow-lg ${rarityConfig.glowClass}` : ''}
          transition-transform hover:scale-105
        `}
      >
        <Icon
          className={`${iconSizes[size]} ${
            isLocked ? 'text-gray-400' : rarityConfig.textClass
          }`}
        />
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30 rounded-xl">
            <span className="text-white text-2xl">🔒</span>
          </div>
        )}
      </div>

      {/* Rarity indicator */}
      {!isLocked && badge.rarity === 'LEGENDARY' && (
        <div className="absolute -top-1 -right-1">
          <Crown className="h-4 w-4 text-yellow-500" />
        </div>
      )}

      {showDetails && (
        <div className="mt-2 text-center">
          <p
            className={`text-sm font-medium ${
              isLocked ? 'text-gray-500' : 'text-gray-900'
            }`}
          >
            {badge.name}
          </p>
          {badge.earnedAt && (
            <p className="text-xs text-gray-400">
              {new Date(badge.earnedAt).toLocaleDateString('it-IT')}
            </p>
          )}
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-gray-900 text-white rounded-lg p-3 shadow-xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                badge.rarity === 'COMMON'
                  ? 'bg-gray-600'
                  : badge.rarity === 'RARE'
                  ? 'bg-blue-600'
                  : badge.rarity === 'EPIC'
                  ? 'bg-purple-600'
                  : 'bg-gradient-to-r from-yellow-500 to-amber-500'
              }`}
            >
              {rarityConfig.label}
            </span>
          </div>
          <p className="font-semibold">{badge.name}</p>
          <p className="text-xs text-gray-300 mt-1">{badge.description}</p>
          {badge.xpReward && (
            <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
              <Star className="h-3 w-3" />+{badge.xpReward} XP
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface BadgeGridProps {
  badges: Badge[];
  allBadges?: Badge[];
  showLocked?: boolean;
  columns?: 4 | 5 | 6;
}

export function BadgeGrid({
  badges,
  allBadges = [],
  showLocked = false,
  columns = 5,
}: BadgeGridProps) {
  const earnedBadgeIds = badges.map((b) => b.id);

  const columnsClass = {
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={`grid ${columnsClass[columns]} gap-4`}>
      {badges.map((badge) => (
        <BadgeDisplay
          key={badge.id}
          badge={badge}
          showDetails
        />
      ))}
      {showLocked &&
        allBadges
          .filter((b) => !earnedBadgeIds.includes(b.id))
          .map((badge) => (
            <BadgeDisplay
              key={badge.id}
              badge={badge}
              showDetails
              isLocked
            />
          ))}
    </div>
  );
}

interface BadgeCategorySectionProps {
  title: string;
  category: Badge['category'];
  badges: Badge[];
  allBadges?: Badge[];
  showLocked?: boolean;
}

export function BadgeCategorySection({
  title,
  category,
  badges,
  allBadges = [],
  showLocked = false,
}: BadgeCategorySectionProps) {
  const CategoryIcon = CATEGORY_ICONS[category];
  const categoryBadges = badges.filter((b) => b.category === category);
  const allCategoryBadges = allBadges.filter((b) => b.category === category);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <CategoryIcon className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">
          {categoryBadges.length}/{allCategoryBadges.length || categoryBadges.length}
        </span>
      </div>

      {categoryBadges.length === 0 && !showLocked ? (
        <p className="text-gray-400 text-sm">
          Nessun badge ottenuto in questa categoria
        </p>
      ) : (
        <BadgeGrid
          badges={categoryBadges}
          allBadges={allCategoryBadges}
          showLocked={showLocked}
          columns={5}
        />
      )}
    </div>
  );
}

interface NewBadgeModalProps {
  badge: Badge;
  onClose: () => void;
}

export function NewBadgeModal({ badge, onClose }: NewBadgeModalProps) {
  const rarityConfig = RARITY_CONFIG[badge.rarity];

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <span className="text-6xl">🎉</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Nuovo Badge Sbloccato!
        </h2>

        <div className="my-6 flex justify-center">
          <BadgeDisplay badge={badge} size="lg" />
        </div>

        <p className="text-xl font-semibold text-gray-900">{badge.name}</p>
        <p className="text-gray-600 mt-2">{badge.description}</p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${rarityConfig.bgClass} ${rarityConfig.textClass}`}
          >
            {rarityConfig.label}
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <Star className="h-4 w-4" />+{badge.xpReward} XP
          </span>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700"
        >
          Fantastico!
        </button>
      </div>

      <style jsx global>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
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
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
