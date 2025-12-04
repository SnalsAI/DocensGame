'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  BookOpen,
  Video,
  Gamepad2,
  Trophy,
  Star,
  ChevronRight,
  LogOut,
  Settings,
  Zap,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
    if (!isLoading && user && (user.role === 'TEACHER' || user.role === 'ADMIN')) {
      router.push('/dashboard/teacher');
    }
  }, [user, isLoading, router]);

  const { data: classrooms } = useQuery({
    queryKey: ['student-classrooms'],
    queryFn: () => api.get('/classrooms').then((res) => res.data),
    enabled: !!user,
  });

  const { data: xpData } = useQuery({
    queryKey: ['student-xp', user?.id],
    queryFn: () => api.get(`/users/${user?.id}/xp`).then((res) => res.data),
    enabled: !!user,
  });

  const { data: badges } = useQuery({
    queryKey: ['student-badges', user?.id],
    queryFn: () => api.get(`/users/${user?.id}/badges`).then((res) => res.data),
    enabled: !!user,
  });

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      await api.post('/classrooms/join', { code: joinCode });
      setJoinCode('');
      // Refresh classrooms
      window.location.reload();
    } catch (error) {
      console.error('Failed to join class:', error);
      alert('Codice classe non valido');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">EDU-ATELIER</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/student/settings"
              className="text-gray-600 hover:text-gray-900"
            >
              <Settings className="h-6 w-6" />
            </Link>
            <button onClick={logout} className="text-gray-600 hover:text-gray-900">
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome & XP */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Ciao, {user.firstName}!
                </h1>
                <p className="text-gray-600">Continua ad imparare e guadagnare XP</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Zap className="h-6 w-6" />
                  <span className="text-3xl font-bold">{xpData?.totalXP || 0}</span>
                </div>
                <p className="text-sm text-gray-500">XP Totali</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 text-purple-500">
                  <Trophy className="h-6 w-6" />
                  <span className="text-3xl font-bold">{badges?.length || 0}</span>
                </div>
                <p className="text-sm text-gray-500">Badge</p>
              </div>
            </div>
          </div>
        </div>

        {/* DSA/BES Notice */}
        {user.studentProfile?.isDsa && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-blue-800">
              <Star className="h-5 w-5 inline mr-2" />
              I tuoi contenuti sono adattati alle tue esigenze. Hai{' '}
              <strong>{user.studentProfile.extraTime}%</strong> di tempo extra nei giochi.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Join Class */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Unisciti a una Classe
              </h2>
              <form onSubmit={handleJoinClass} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Inserisci il codice classe"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  maxLength={8}
                />
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Unisciti
                </button>
              </form>
            </div>

            {/* My Classes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Le mie Classi
              </h2>
              <div className="space-y-3">
                {classrooms?.map(
                  (classroom: { id: string; name: string; teacher?: { firstName: string; lastName: string } }) => (
                    <Link
                      key={classroom.id}
                      href={`/dashboard/student/classrooms/${classroom.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{classroom.name}</p>
                          <p className="text-sm text-gray-500">
                            Prof. {classroom.teacher?.firstName} {classroom.teacher?.lastName}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </Link>
                  )
                )}
                {(!classrooms || classrooms.length === 0) && (
                  <p className="text-gray-500 text-center py-8">
                    Non sei iscritto a nessuna classe. Inserisci un codice per unirti!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Azioni Rapide
              </h2>
              <div className="space-y-3">
                <Link
                  href="/game/join"
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50 text-secondary-700 hover:bg-secondary-100 transition-colors"
                >
                  <Gamepad2 className="h-5 w-5" />
                  <span>Unisciti a un Gioco</span>
                </Link>
                <Link
                  href="/dashboard/student/lessons"
                  className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  <Video className="h-5 w-5" />
                  <span>Le mie Lezioni</span>
                </Link>
              </div>
            </div>

            {/* Recent Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Badge Recenti
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {badges?.slice(0, 6).map(
                  (userBadge: { id: string; badge: { name: string; iconUrl: string } }) => (
                    <div
                      key={userBadge.id}
                      className="aspect-square rounded-lg bg-yellow-50 flex items-center justify-center"
                      title={userBadge.badge.name}
                    >
                      <Trophy className="h-8 w-8 text-yellow-500" />
                    </div>
                  )
                )}
                {(!badges || badges.length === 0) && (
                  <p className="col-span-3 text-gray-500 text-center py-4 text-sm">
                    Nessun badge ancora. Gioca per guadagnarne!
                  </p>
                )}
              </div>
            </div>

            {/* Recent XP */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                XP Recenti
              </h2>
              <div className="space-y-2">
                {xpData?.recentRewards?.slice(0, 5).map(
                  (reward: { id: string; amount: number; source: string; createdAt: string }) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">
                        {formatXPSource(reward.source)}
                      </span>
                      <span className="font-medium text-yellow-600">
                        +{reward.amount} XP
                      </span>
                    </div>
                  )
                )}
                {(!xpData?.recentRewards || xpData.recentRewards.length === 0) && (
                  <p className="text-gray-500 text-center py-4 text-sm">
                    Nessun XP guadagnato ancora.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatXPSource(source: string): string {
  const labels: Record<string, string> = {
    LESSON_COMPLETED: 'Lezione completata',
    QUIZ_COMPLETED: 'Quiz completato',
    GAME_PARTICIPATION: 'Partecipazione gioco',
    GAME_WIN: 'Vittoria gioco',
    DAILY_LOGIN: 'Login giornaliero',
    STREAK_BONUS: 'Bonus serie',
    ACHIEVEMENT: 'Achievement',
  };
  return labels[source] || source;
}
