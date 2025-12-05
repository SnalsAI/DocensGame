'use client';

import { useState, useEffect } from 'react';

interface PlatformStats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalClassrooms: number;
  totalContents: number;
  totalVideoLessons: number;
  totalQuizzes: number;
  totalGameSessions: number;
  activeUsers24h: number;
  newUsersWeek: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: boolean;
  redis: boolean;
  aiService: boolean;
  videoService: boolean;
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
  cpu: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'content_created' | 'game_played' | 'quiz_completed';
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    // Simulated data fetch
    const fetchData = async () => {
      setLoading(true);

      // Simulated API calls
      await new Promise(resolve => setTimeout(resolve, 500));

      setStats({
        totalUsers: 1247,
        totalTeachers: 89,
        totalStudents: 1158,
        totalClassrooms: 156,
        totalContents: 423,
        totalVideoLessons: 287,
        totalQuizzes: 892,
        totalGameSessions: 3456,
        activeUsers24h: 234,
        newUsersWeek: 45,
      });

      setHealth({
        status: 'healthy',
        database: true,
        redis: true,
        aiService: true,
        videoService: true,
        uptime: 2592000, // 30 days in seconds
        memory: { used: 2.4, total: 8 },
        cpu: 23,
      });

      setActivities([
        {
          id: '1',
          type: 'user_registered',
          description: 'Nuovo docente registrato',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          userName: 'Prof. Bianchi',
        },
        {
          id: '2',
          type: 'content_created',
          description: 'Nuova lezione video creata',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          userName: 'Prof. Rossi',
        },
        {
          id: '3',
          type: 'game_played',
          description: 'Sessione Boss Fight completata',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          userName: 'Classe 3A',
        },
        {
          id: '4',
          type: 'quiz_completed',
          description: '25 studenti hanno completato il quiz',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          userName: 'Classe 2B',
        },
      ]);

      setLoading(false);
    };

    fetchData();
  }, [selectedPeriod]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}g ${hours}h`;
  };

  const formatTimeAgo = (date: Date): string => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m fa`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h fa`;
    return `${Math.floor(hours / 24)}g fa`;
  };

  const getActivityIcon = (type: RecentActivity['type']): string => {
    switch (type) {
      case 'user_registered': return '👤';
      case 'content_created': return '📝';
      case 'game_played': return '🎮';
      case 'quiz_completed': return '✅';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Panoramica della piattaforma EDU-ATELIER</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'day' | 'week' | 'month')}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="day">Ultimo giorno</option>
                <option value="week">Ultima settimana</option>
                <option value="month">Ultimo mese</option>
              </select>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Esporta Report
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Health */}
        {health && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stato del Sistema</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${health.status === 'healthy' ? 'bg-green-500' : health.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <p className="text-sm font-medium">Sistema</p>
                <p className="text-xs text-gray-500 capitalize">{health.status}</p>
              </div>
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${health.database ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-gray-500">{health.database ? 'Online' : 'Offline'}</p>
              </div>
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${health.redis ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className="text-sm font-medium">Redis</p>
                <p className="text-xs text-gray-500">{health.redis ? 'Online' : 'Offline'}</p>
              </div>
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${health.aiService ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className="text-sm font-medium">AI Service</p>
                <p className="text-xs text-gray-500">{health.aiService ? 'Online' : 'Offline'}</p>
              </div>
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${health.videoService ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className="text-sm font-medium">Video Service</p>
                <p className="text-xs text-gray-500">{health.videoService ? 'Online' : 'Offline'}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-600">{formatUptime(health.uptime)}</p>
                <p className="text-sm font-medium">Uptime</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memoria</span>
                  <span>{health.memory.used}GB / {health.memory.total}GB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(health.memory.used / health.memory.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU</span>
                  <span>{health.cpu}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${health.cpu}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Utenti Totali</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <span className="text-green-600">+{stats.newUsersWeek}</span>
                <span className="text-gray-500"> questa settimana</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Classi</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalClassrooms}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {stats.totalTeachers} docenti, {stats.totalStudents} studenti
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Contenuti</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalContents}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {stats.totalVideoLessons} video, {stats.totalQuizzes} quiz
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Sessioni Gioco</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalGameSessions.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {stats.activeUsers24h} utenti attivi oggi
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Attività Recente</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start">
                    <span className="text-2xl mr-3">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      {activity.userName && (
                        <p className="text-sm text-gray-500">{activity.userName}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full text-center text-sm text-indigo-600 hover:text-indigo-500">
                Vedi tutte le attività
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Azioni Rapide</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="text-2xl mb-2">👥</div>
                  <p className="font-medium">Gestione Utenti</p>
                  <p className="text-sm text-gray-500">Aggiungi o modifica utenti</p>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="text-2xl mb-2">🏫</div>
                  <p className="font-medium">Gestione Scuole</p>
                  <p className="text-sm text-gray-500">Configura scuole e licenze</p>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="font-medium">Report Analytics</p>
                  <p className="text-sm text-gray-500">Visualizza statistiche dettagliate</p>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="text-2xl mb-2">⚙️</div>
                  <p className="font-medium">Configurazione</p>
                  <p className="text-sm text-gray-500">Impostazioni piattaforma</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Distribution */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Utenti</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Per Ruolo</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-24 text-sm">Studenti</div>
                  <div className="flex-1 h-4 bg-gray-200 rounded">
                    <div className="h-4 bg-indigo-500 rounded" style={{ width: '92%' }}></div>
                  </div>
                  <div className="w-16 text-right text-sm">92%</div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm">Docenti</div>
                  <div className="flex-1 h-4 bg-gray-200 rounded">
                    <div className="h-4 bg-green-500 rounded" style={{ width: '7%' }}></div>
                  </div>
                  <div className="w-16 text-right text-sm">7%</div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm">Admin</div>
                  <div className="flex-1 h-4 bg-gray-200 rounded">
                    <div className="h-4 bg-purple-500 rounded" style={{ width: '1%' }}></div>
                  </div>
                  <div className="w-16 text-right text-sm">1%</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Studenti Speciali</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-24 text-sm">DSA</div>
                  <div className="flex-1 h-4 bg-gray-200 rounded">
                    <div className="h-4 bg-orange-500 rounded" style={{ width: '12%' }}></div>
                  </div>
                  <div className="w-16 text-right text-sm">12%</div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm">BES</div>
                  <div className="flex-1 h-4 bg-gray-200 rounded">
                    <div className="h-4 bg-yellow-500 rounded" style={{ width: '5%' }}></div>
                  </div>
                  <div className="w-16 text-right text-sm">5%</div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm">L2</div>
                  <div className="flex-1 h-4 bg-gray-200 rounded">
                    <div className="h-4 bg-blue-500 rounded" style={{ width: '8%' }}></div>
                  </div>
                  <div className="w-16 text-right text-sm">8%</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Attività</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-24 text-sm">Attivi</div>
                  <div className="flex-1 h-4 bg-gray-200 rounded">
                    <div className="h-4 bg-green-500 rounded" style={{ width: '68%' }}></div>
                  </div>
                  <div className="w-16 text-right text-sm">68%</div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm">Inattivi</div>
                  <div className="flex-1 h-4 bg-gray-200 rounded">
                    <div className="h-4 bg-gray-400 rounded" style={{ width: '32%' }}></div>
                  </div>
                  <div className="w-16 text-right text-sm">32%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
