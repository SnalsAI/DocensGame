'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Video,
  Plus,
  Search,
  Filter,
  Play,
  Edit,
  Trash2,
  Clock,
  Eye,
  Users,
  MoreVertical,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

type VideoLesson = {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'ERROR';
  thumbnailUrl?: string;
  viewCount: number;
  content?: { title: string };
  classroom?: { name: string };
  createdAt: string;
};

const STATUS_CONFIG = {
  DRAFT: { label: 'Bozza', color: 'gray', icon: Edit },
  PROCESSING: { label: 'In elaborazione', color: 'yellow', icon: Loader2 },
  READY: { label: 'Pronto', color: 'green', icon: CheckCircle },
  ERROR: { label: 'Errore', color: 'red', icon: XCircle },
};

export default function LessonsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  // Fetch lessons
  const { data: lessons, isLoading } = useQuery<VideoLesson[]>({
    queryKey: ['lessons'],
    queryFn: () => api.get('/lessons').then((res) => res.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/lessons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setSelectedLesson(null);
    },
  });

  // Filter lessons
  const filteredLessons = lessons?.filter((lesson) => {
    const matchesSearch = lesson.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || lesson.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Lezioni</h1>
            <p className="text-gray-600 mt-1">
              Gestisci le tue video-lezioni con avatar parlante
            </p>
          </div>
          <Link
            href="/dashboard/teacher/content"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crea da Contenuto
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Totali</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons?.filter((l) => l.status === 'READY').length || 0}
                </p>
                <p className="text-sm text-gray-500">Pronte</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Loader2 className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons?.filter((l) => l.status === 'PROCESSING').length || 0}
                </p>
                <p className="text-sm text-gray-500">In elaborazione</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons?.reduce((acc, l) => acc + l.viewCount, 0) || 0}
                </p>
                <p className="text-sm text-gray-500">Visualizzazioni</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca video lezioni..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tutti gli stati</option>
                <option value="DRAFT">Bozza</option>
                <option value="PROCESSING">In elaborazione</option>
                <option value="READY">Pronto</option>
                <option value="ERROR">Errore</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : filteredLessons?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessuna video lezione
            </h3>
            <p className="text-gray-500 mb-4">
              Crea la tua prima video lezione partendo da un contenuto
            </p>
            <Link
              href="/dashboard/teacher/content"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Vai ai Contenuti
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons?.map((lesson) => {
              const statusConfig = STATUS_CONFIG[lesson.status];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={lesson.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-100">
                    {lesson.thumbnailUrl ? (
                      <img
                        src={lesson.thumbnailUrl}
                        alt={lesson.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-16 w-16 text-gray-300" />
                      </div>
                    )}

                    {/* Overlay on hover */}
                    {lesson.status === 'READY' && (
                      <Link
                        href={`/dashboard/teacher/lessons/${lesson.id}`}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <div className="p-4 bg-white rounded-full">
                          <Play className="h-8 w-8 text-primary-600" />
                        </div>
                      </Link>
                    )}

                    {/* Duration badge */}
                    {lesson.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(lesson.duration)}
                      </div>
                    )}

                    {/* Status badge */}
                    <div
                      className={`absolute top-2 left-2 flex items-center gap-1 text-xs px-2 py-1 rounded ${
                        statusConfig.color === 'gray'
                          ? 'bg-gray-100 text-gray-600'
                          : statusConfig.color === 'yellow'
                          ? 'bg-yellow-100 text-yellow-600'
                          : statusConfig.color === 'green'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      <StatusIcon
                        className={`h-3 w-3 ${
                          lesson.status === 'PROCESSING' ? 'animate-spin' : ''
                        }`}
                      />
                      {statusConfig.label}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {lesson.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {lesson.viewCount}
                        </span>
                        {lesson.classroom && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {lesson.classroom.name}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setSelectedLesson(
                              selectedLesson === lesson.id ? null : lesson.id
                            )
                          }
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {selectedLesson === lesson.id && (
                          <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[140px]">
                            <Link
                              href={`/dashboard/teacher/lessons/${lesson.id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              <Play className="h-4 w-4" />
                              Visualizza
                            </Link>
                            <Link
                              href={`/dashboard/teacher/lessons/${lesson.id}/edit`}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4" />
                              Modifica
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Eliminare questa video lezione?')) {
                                  deleteMutation.mutate(lesson.id);
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                            >
                              <Trash2 className="h-4 w-4" />
                              Elimina
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
