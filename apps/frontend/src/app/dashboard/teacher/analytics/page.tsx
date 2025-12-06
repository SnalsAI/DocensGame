'use client';

import { useState, useEffect } from 'react';

interface ClassroomStats {
  id: string;
  name: string;
  studentCount: number;
  avgScore: number;
  completionRate: number;
  activeStudents: number;
}

interface StudentPerformance {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  totalXP: number;
  level: number;
  quizzesCompleted: number;
  avgScore: number;
  gamesPlayed: number;
  lastActive: Date;
  badges: number;
  isDSA: boolean;
  isL2: boolean;
}

interface ContentPerformance {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'game';
  views: number;
  completions: number;
  avgScore: number;
  avgTimeSpent: number;
}

interface TimeSeriesData {
  date: string;
  students: number;
  quizzes: number;
  games: number;
}

export default function TeacherAnalyticsPage() {
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester'>('month');
  const [classrooms, setClassrooms] = useState<ClassroomStats[]>([]);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [contents, setContents] = useState<ContentPerformance[]>([]);
  const [activityData, setActivityData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data fetch
    const fetchAnalytics = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      setClassrooms([
        { id: '1', name: 'Matematica 3A', studentCount: 25, avgScore: 78, completionRate: 85, activeStudents: 22 },
        { id: '2', name: 'Italiano 2B', studentCount: 28, avgScore: 72, completionRate: 79, activeStudents: 24 },
        { id: '3', name: 'Storia 4C', studentCount: 23, avgScore: 81, completionRate: 88, activeStudents: 20 },
      ]);

      setStudents([
        { id: '1', name: 'Marco Rossi', email: 'marco@scuola.it', totalXP: 2450, level: 12, quizzesCompleted: 34, avgScore: 85, gamesPlayed: 18, lastActive: new Date(), badges: 8, isDSA: false, isL2: false },
        { id: '2', name: 'Giulia Bianchi', email: 'giulia@scuola.it', totalXP: 3200, level: 15, quizzesCompleted: 42, avgScore: 92, gamesPlayed: 25, lastActive: new Date(), badges: 12, isDSA: false, isL2: false },
        { id: '3', name: 'Luca Verdi', email: 'luca@scuola.it', totalXP: 1800, level: 9, quizzesCompleted: 28, avgScore: 71, gamesPlayed: 15, lastActive: new Date(Date.now() - 86400000), badges: 5, isDSA: true, isL2: false },
        { id: '4', name: 'Ana Popescu', email: 'ana@scuola.it', totalXP: 2100, level: 10, quizzesCompleted: 31, avgScore: 76, gamesPlayed: 20, lastActive: new Date(), badges: 7, isDSA: false, isL2: true },
        { id: '5', name: 'Sofia Neri', email: 'sofia@scuola.it', totalXP: 1500, level: 8, quizzesCompleted: 22, avgScore: 68, gamesPlayed: 12, lastActive: new Date(Date.now() - 172800000), badges: 4, isDSA: false, isL2: false },
      ]);

      setContents([
        { id: '1', title: 'Equazioni di secondo grado', type: 'video', views: 156, completions: 134, avgScore: 0, avgTimeSpent: 420 },
        { id: '2', title: 'Quiz: Algebra lineare', type: 'quiz', views: 145, completions: 142, avgScore: 78, avgTimeSpent: 180 },
        { id: '3', title: 'Boss Fight: Geometria', type: 'game', views: 89, completions: 76, avgScore: 82, avgTimeSpent: 600 },
        { id: '4', title: 'La Rivoluzione Francese', type: 'video', views: 178, completions: 165, avgScore: 0, avgTimeSpent: 540 },
        { id: '5', title: 'Quiz: Storia Moderna', type: 'quiz', views: 167, completions: 158, avgScore: 74, avgTimeSpent: 240 },
      ]);

      setActivityData([
        { date: '01/11', students: 45, quizzes: 78, games: 23 },
        { date: '08/11', students: 52, quizzes: 92, games: 31 },
        { date: '15/11', students: 48, quizzes: 85, games: 28 },
        { date: '22/11', students: 55, quizzes: 98, games: 35 },
        { date: '29/11', students: 51, quizzes: 88, games: 29 },
      ]);

      setLoading(false);
    };

    fetchAnalytics();
  }, [selectedClassroom, selectedPeriod]);

  const totalStudents = classrooms.reduce((sum, c) => sum + c.studentCount, 0);
  const avgCompletionRate = classrooms.length > 0
    ? Math.round(classrooms.reduce((sum, c) => sum + c.completionRate, 0) / classrooms.length)
    : 0;
  const dsaStudents = students.filter(s => s.isDSA).length;
  const l2Students = students.filter(s => s.isL2).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento analytics...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics Docente</h1>
              <p className="mt-1 text-sm text-gray-500">Monitora i progressi dei tuoi studenti</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="all">Tutte le classi</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="week">Ultima settimana</option>
                <option value="month">Ultimo mese</option>
                <option value="semester">Semestre</option>
              </select>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Esporta PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Studenti Totali</p>
                <p className="text-2xl font-semibold text-gray-900">{totalStudents}</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {dsaStudents} DSA, {l2Students} L2
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completamento</p>
                <p className="text-2xl font-semibold text-gray-900">{avgCompletionRate}%</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${avgCompletionRate}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Media Voti</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(classrooms.reduce((sum, c) => sum + c.avgScore, 0) / classrooms.length)}%
                </p>
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600">
              +5% vs mese precedente
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Studenti Attivi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {classrooms.reduce((sum, c) => sum + c.activeStudents, 0)}
                </p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Ultimi 7 giorni
            </div>
          </div>
        </div>

        {/* Activity Chart Placeholder */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attività nel Tempo</h2>
          <div className="h-64 flex items-end justify-between space-x-2">
            {activityData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col space-y-1">
                  <div
                    className="w-full bg-green-500 rounded-t"
                    style={{ height: `${data.students * 2}px` }}
                    title={`Studenti: ${data.students}`}
                  ></div>
                  <div
                    className="w-full bg-blue-500"
                    style={{ height: `${data.quizzes}px` }}
                    title={`Quiz: ${data.quizzes}`}
                  ></div>
                  <div
                    className="w-full bg-purple-500 rounded-b"
                    style={{ height: `${data.games * 2}px` }}
                    title={`Giochi: ${data.games}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{data.date}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Studenti attivi</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Quiz completati</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Sessioni gioco</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Top Students */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Top Studenti</h2>
              <button className="text-sm text-green-600 hover:text-green-700">Vedi tutti</button>
            </div>
            <div className="divide-y">
              {students.slice(0, 5).map((student, index) => (
                <div key={student.id} className="p-4 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                    {index + 1}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      {student.isDSA && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">DSA</span>
                      )}
                      {student.isL2 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">L2</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Livello {student.level} • {student.totalXP} XP</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{student.avgScore}%</p>
                    <p className="text-xs text-gray-500">{student.quizzesCompleted} quiz</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Contenuti Popolari</h2>
              <button className="text-sm text-green-600 hover:text-green-700">Vedi tutti</button>
            </div>
            <div className="divide-y">
              {contents.map((content) => (
                <div key={content.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">
                        {content.type === 'video' ? '🎬' : content.type === 'quiz' ? '📝' : '🎮'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{content.title}</p>
                        <p className="text-sm text-gray-500">
                          {content.views} visualizzazioni • {content.completions} completamenti
                        </p>
                      </div>
                    </div>
                    {content.type !== 'video' && (
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{content.avgScore}%</p>
                        <p className="text-xs text-gray-500">media</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${(content.completions / content.views) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Classroom Comparison */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Confronto Classi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studenti</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media Voti</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attivi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classrooms.map((classroom) => (
                  <tr key={classroom.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{classroom.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classroom.studentCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          classroom.avgScore >= 80 ? 'text-green-600' :
                          classroom.avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {classroom.avgScore}%
                        </span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              classroom.avgScore >= 80 ? 'bg-green-500' :
                              classroom.avgScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${classroom.avgScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{classroom.completionRate}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {classroom.activeStudents}/{classroom.studentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-green-600 hover:text-green-900 mr-3">Dettagli</button>
                      <button className="text-gray-600 hover:text-gray-900">Report</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students at Risk */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Studenti da Supportare</h2>
            <p className="text-sm text-gray-500">Studenti con performance sotto la media o inattivi</p>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              {students.filter(s => s.avgScore < 70 || s.lastActive < new Date(Date.now() - 172800000)).map((student) => (
                <div key={student.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        {student.isDSA && <span className="mr-2">DSA</span>}
                        {student.isL2 && <span className="mr-2">L2</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {student.avgScore < 70 && (
                      <p className="text-sm text-red-600">Media: {student.avgScore}%</p>
                    )}
                    {student.lastActive < new Date(Date.now() - 172800000) && (
                      <p className="text-sm text-orange-600">
                        Inattivo da {Math.floor((Date.now() - student.lastActive.getTime()) / 86400000)} giorni
                      </p>
                    )}
                  </div>
                  <button className="mt-3 w-full text-center text-sm text-red-700 hover:text-red-800 font-medium">
                    Contatta studente
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
