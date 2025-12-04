'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Video,
  Gamepad2,
  Plus,
  ChevronRight,
  FileText,
  BarChart3,
  LogOut,
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
    if (!isLoading && user && user.role === 'STUDENT') {
      router.push('/dashboard/student');
    }
  }, [user, isLoading, router]);

  const { data: classrooms } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => api.get('/classrooms').then((res) => res.data),
    enabled: !!user,
  });

  const { data: contents } = useQuery({
    queryKey: ['contents'],
    queryFn: () => api.get('/content').then((res) => res.data),
    enabled: !!user,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r">
        <div className="flex items-center gap-2 p-4 border-b">
          <BookOpen className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold">EDU-ATELIER</span>
        </div>

        <nav className="p-4 space-y-2">
          <NavItem href="/dashboard/teacher" icon={<BarChart3 />} label="Dashboard" active />
          <NavItem href="/dashboard/teacher/classrooms" icon={<Users />} label="Classi" />
          <NavItem href="/dashboard/teacher/content" icon={<FileText />} label="Contenuti" />
          <NavItem href="/dashboard/teacher/lessons" icon={<Video />} label="Video-Lezioni" />
          <NavItem href="/dashboard/teacher/games" icon={<Gamepad2 />} label="Giochi" />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Esci
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Ciao, {user.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Ecco il riepilogo della tua attività didattica.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <QuickActionCard
            href="/dashboard/teacher/content/new"
            icon={<Plus className="h-6 w-6" />}
            label="Nuovo Contenuto"
            color="primary"
          />
          <QuickActionCard
            href="/dashboard/teacher/lessons/new"
            icon={<Video className="h-6 w-6" />}
            label="Nuova Video-Lezione"
            color="secondary"
          />
          <QuickActionCard
            href="/dashboard/teacher/games/new"
            icon={<Gamepad2 className="h-6 w-6" />}
            label="Nuovo Gioco"
            color="purple"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Classi"
            value={classrooms?.length || 0}
            icon={<Users className="h-5 w-5 text-blue-600" />}
          />
          <StatCard
            label="Contenuti"
            value={contents?.length || 0}
            icon={<FileText className="h-5 w-5 text-green-600" />}
          />
          <StatCard
            label="Video-Lezioni"
            value={contents?.reduce((acc: number, c: { _count?: { videoLessons?: number } }) => acc + (c._count?.videoLessons || 0), 0) || 0}
            icon={<Video className="h-5 w-5 text-purple-600" />}
          />
          <StatCard
            label="Quiz Generati"
            value={contents?.reduce((acc: number, c: { _count?: { quizzes?: number } }) => acc + (c._count?.quizzes || 0), 0) || 0}
            icon={<Gamepad2 className="h-5 w-5 text-orange-600" />}
          />
        </div>

        {/* Recent Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Classrooms */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Le tue Classi</h2>
              <Link
                href="/dashboard/teacher/classrooms"
                className="text-primary-600 text-sm hover:underline flex items-center gap-1"
              >
                Vedi tutte <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {classrooms?.slice(0, 5).map((classroom: { id: string; name: string; _count?: { students?: number; contents?: number } }) => (
                <Link
                  key={classroom.id}
                  href={`/dashboard/teacher/classrooms/${classroom.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{classroom.name}</p>
                      <p className="text-sm text-gray-500">
                        {classroom._count?.students || 0} studenti
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              ))}
              {(!classrooms || classrooms.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  Nessuna classe creata. <Link href="/dashboard/teacher/classrooms/new" className="text-primary-600 hover:underline">Crea la prima!</Link>
                </p>
              )}
            </div>
          </div>

          {/* Recent Content */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contenuti Recenti</h2>
              <Link
                href="/dashboard/teacher/content"
                className="text-primary-600 text-sm hover:underline flex items-center gap-1"
              >
                Vedi tutti <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {contents?.slice(0, 5).map((content: { id: string; title: string; type: string; status: string }) => (
                <Link
                  key={content.id}
                  href={`/dashboard/teacher/content/${content.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-secondary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{content.title}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {content.type.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={content.status} />
                </Link>
              ))}
              {(!contents || contents.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  Nessun contenuto creato. <Link href="/dashboard/teacher/content/new" className="text-primary-600 hover:underline">Carica il primo!</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-primary-50 text-primary-600'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function QuickActionCard({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: 'primary' | 'secondary' | 'purple';
}) {
  const colors = {
    primary: 'bg-primary-600 hover:bg-primary-700',
    secondary: 'bg-secondary-600 hover:bg-secondary-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  };

  return (
    <Link
      href={href}
      className={`${colors[color]} text-white rounded-xl p-4 flex items-center gap-3 transition-colors`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PROCESSING: 'bg-yellow-100 text-yellow-600',
    READY: 'bg-green-100 text-green-600',
    ERROR: 'bg-red-100 text-red-600',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || colors.DRAFT}`}>
      {status}
    </span>
  );
}
