'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  User,
  Star,
  Trophy,
  Target,
  Medal,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
  Settings,
  Edit,
  Loader2,
  BookOpen,
  Gamepad2,
  Users,
  Flame,
} from 'lucide-react';
import {
  BadgeDisplay,
  BadgeCategorySection,
  type Badge,
} from '@/components/gamification/BadgeDisplay';
import {
  XPDisplay,
  XPProgressCard,
} from '@/components/gamification/XPDisplay';

type UserStats = {
  level: number;
  totalXP: number;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
  badges: { badge: Badge; earnedAt: Date }[];
  recentXP: { amount: number; source: string; createdAt: Date }[];
};

type ActivityStats = {
  lessonsCompleted: number;
  quizzesTaken: number;
  gamesPlayed: number;
  gamesWon: number;
  correctAnswers: number;
  currentStreak: number;
  longestStreak: number;
  totalPlayTime: number;
};

export default function StudentProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'activity'>('overview');

  // Fetch gamification stats
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['gamification-stats'],
    queryFn: () => api.get('/gamification/stats').then((res) => res.data),
  });

  // Fetch all badge definitions for "locked" display
  const { data: allBadges } = useQuery<Badge[]>({
    queryKey: ['all-badges'],
    queryFn: () => api.get('/gamification/badges').then((res) => res.data),
  });

  // Fetch activity stats
  const { data: activity, isLoading: activityLoading } = useQuery<ActivityStats>({
    queryKey: ['activity-stats'],
    queryFn: () => api.get('/users/me/activity-stats').then((res) => res.data),
  });

  // Fetch leaderboard position
  const { data: leaderboard } = useQuery({
    queryKey: ['my-leaderboard-position'],
    queryFn: () => api.get('/gamification/leaderboard?limit=100').then((res) => res.data),
  });

  const isLoading = statsLoading || activityLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const earnedBadges = stats?.badges.map((b) => ({ ...b.badge, earnedAt: b.earnedAt })) || [];
  const myRank = leaderboard?.findIndex((p: any) => p.isCurrentUser) + 1 || '---';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                <User className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-2 shadow-lg">
                <span className="text-lg font-bold text-yellow-900">
                  {stats?.level || 1}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Il tuo Profilo</h1>
              <p className="text-white/70">Livello {stats?.level || 1} • {stats?.totalXP?.toLocaleString() || 0} XP</p>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-white/90">
                  <Trophy className="h-5 w-5" />
                  <span>{earnedBadges.length} Badge</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Medal className="h-5 w-5" />
                  <span>#{myRank} Classifica</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Flame className="h-5 w-5" />
                  <span>{activity?.currentStreak || 0} giorni di fila</span>
                </div>
              </div>
            </div>

            {/* Settings */}
            <Link
              href="/dashboard/student/settings"
              className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Settings className="h-6 w-6 text-white" />
            </Link>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-white/70 mb-2">
              <span>Livello {stats?.level || 1}</span>
              <span>
                {stats?.currentXP?.toLocaleString() || 0} / {stats?.nextLevelXP?.toLocaleString() || 100} XP
              </span>
              <span>Livello {(stats?.level || 0) + 1}</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-1000"
                style={{ width: `${stats?.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { id: 'overview', label: 'Panoramica', icon: Target },
            { id: 'badges', label: 'Badge', icon: Award },
            { id: 'activity', label: 'Attività', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {activity?.lessonsCompleted || 0}
                    </p>
                    <p className="text-sm text-gray-500">Lezioni completate</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {activity?.correctAnswers || 0}
                    </p>
                    <p className="text-sm text-gray-500">Risposte corrette</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Gamepad2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {activity?.gamesPlayed || 0}
                    </p>
                    <p className="text-sm text-gray-500">Giochi giocati</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {activity?.gamesWon || 0}
                    </p>
                    <p className="text-sm text-gray-500">Vittorie</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent XP */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                XP Recenti
              </h3>
              {stats?.recentXP && stats.recentXP.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentXP.map((xp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Star className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{xp.source}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(xp.createdAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      <span className="text-green-600 font-semibold">+{xp.amount} XP</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  Nessun XP guadagnato di recente
                </p>
              )}
            </div>

            {/* Recent Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary-500" />
                  Badge Recenti
                </h3>
                <button
                  onClick={() => setActiveTab('badges')}
                  className="text-primary-600 text-sm flex items-center gap-1 hover:underline"
                >
                  Vedi tutti
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              {earnedBadges.length > 0 ? (
                <div className="flex gap-4">
                  {earnedBadges.slice(0, 5).map((badge) => (
                    <BadgeDisplay
                      key={badge.id}
                      badge={badge}
                      size="md"
                      showDetails
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  Nessun badge ottenuto ancora. Continua a giocare per sbloccarli!
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                I tuoi Badge ({earnedBadges.length}/{allBadges?.length || 0})
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Mostra bloccati</span>
                <input
                  type="checkbox"
                  className="rounded text-primary-600"
                  defaultChecked
                />
              </div>
            </div>

            <BadgeCategorySection
              title="Apprendimento"
              category="LEARNING"
              badges={earnedBadges}
              allBadges={allBadges}
              showLocked
            />

            <BadgeCategorySection
              title="Gaming"
              category="GAMING"
              badges={earnedBadges}
              allBadges={allBadges}
              showLocked
            />

            <BadgeCategorySection
              title="Sociale"
              category="SOCIAL"
              badges={earnedBadges}
              allBadges={allBadges}
              showLocked
            />

            <BadgeCategorySection
              title="Speciali"
              category="SPECIAL"
              badges={earnedBadges}
              allBadges={allBadges}
              showLocked
            />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Streak Info */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Serie Attuale</h3>
                  <p className="text-white/80 text-sm">
                    Gioca ogni giorno per mantenere la serie!
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2">
                    <Flame className="h-10 w-10" />
                    <span className="text-5xl font-bold">{activity?.currentStreak || 0}</span>
                  </div>
                  <p className="text-white/80 text-sm">giorni</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-white/80 text-sm">Record personale:</span>
                <span className="font-semibold">{activity?.longestStreak || 0} giorni</span>
              </div>
            </div>

            {/* Activity Calendar (placeholder) */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-500" />
                Attività del Mese
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, idx) => {
                  const intensity = Math.random();
                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded ${
                        intensity > 0.8
                          ? 'bg-green-500'
                          : intensity > 0.5
                          ? 'bg-green-400'
                          : intensity > 0.3
                          ? 'bg-green-300'
                          : intensity > 0.1
                          ? 'bg-green-200'
                          : 'bg-gray-100'
                      }`}
                      title={`Giorno ${idx + 1}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 mt-2 text-xs text-gray-500">
                <span>Meno</span>
                <div className="w-3 h-3 rounded bg-gray-100" />
                <div className="w-3 h-3 rounded bg-green-200" />
                <div className="w-3 h-3 rounded bg-green-300" />
                <div className="w-3 h-3 rounded bg-green-400" />
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Più</span>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-500" />
                Statistiche Dettagliate
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Tempo totale di gioco</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor((activity?.totalPlayTime || 0) / 60)}h {(activity?.totalPlayTime || 0) % 60}m
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Quiz completati</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activity?.quizzesTaken || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Tasso di vittoria</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activity?.gamesPlayed
                      ? Math.round((activity.gamesWon / activity.gamesPlayed) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Precisione risposte</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activity?.quizzesTaken && activity.correctAnswers
                      ? Math.round((activity.correctAnswers / (activity.quizzesTaken * 10)) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
