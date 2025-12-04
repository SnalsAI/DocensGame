'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  FileText,
  File,
  Image,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Wand2,
  Video,
  HelpCircle,
  Map,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

type Content = {
  id: string;
  title: string;
  description?: string;
  type: 'TEXT' | 'PDF' | 'IMAGE';
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'ERROR';
  hasSummary: boolean;
  hasQuiz: boolean;
  hasConceptMap: boolean;
  hasVideoLesson: boolean;
  classroom?: { name: string };
  createdAt: string;
  updatedAt: string;
};

const TYPE_ICONS = {
  TEXT: FileText,
  PDF: File,
  IMAGE: Image,
};

const STATUS_CONFIG = {
  DRAFT: { label: 'Bozza', color: 'gray', icon: Edit },
  PROCESSING: { label: 'Elaborazione', color: 'yellow', icon: Loader2 },
  READY: { label: 'Pronto', color: 'green', icon: CheckCircle },
  ERROR: { label: 'Errore', color: 'red', icon: AlertCircle },
};

export default function ContentListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Fetch contents
  const { data: contents, isLoading } = useQuery<Content[]>({
    queryKey: ['contents'],
    queryFn: () => api.get('/content').then((res) => res.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      setOpenMenu(null);
    },
  });

  // Filter contents
  const filteredContents = contents?.filter((content) => {
    const matchesSearch =
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || content.type === typeFilter;
    const matchesStatus = !statusFilter || content.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contenuti</h1>
            <p className="text-gray-600 mt-1">
              Gestisci i tuoi materiali didattici e genera contenuti con l'AI
            </p>
          </div>
          <Link
            href="/dashboard/teacher/content/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuovo Contenuto
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contents?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Totali</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wand2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contents?.filter((c) => c.hasSummary).length || 0}
                </p>
                <p className="text-sm text-gray-500">Con riassunto</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <HelpCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contents?.filter((c) => c.hasQuiz).length || 0}
                </p>
                <p className="text-sm text-gray-500">Con quiz</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Map className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contents?.filter((c) => c.hasConceptMap).length || 0}
                </p>
                <p className="text-sm text-gray-500">Con mappa</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Video className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contents?.filter((c) => c.hasVideoLesson).length || 0}
                </p>
                <p className="text-sm text-gray-500">Con video</p>
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
                placeholder="Cerca contenuti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tutti i tipi</option>
                <option value="TEXT">Testo</option>
                <option value="PDF">PDF</option>
                <option value="IMAGE">Immagine</option>
              </select>
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

        {/* Content List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : filteredContents?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun contenuto trovato
            </h3>
            <p className="text-gray-500 mb-4">
              Inizia caricando il tuo primo contenuto didattico
            </p>
            <Link
              href="/dashboard/teacher/content/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Nuovo Contenuto
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contenuto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Generazioni AI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContents?.map((content) => {
                  const TypeIcon = TYPE_ICONS[content.type];
                  const statusConfig = STATUS_CONFIG[content.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={content.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/teacher/content/${content.id}`}
                          className="block"
                        >
                          <p className="font-medium text-gray-900 hover:text-primary-600">
                            {content.title}
                          </p>
                          {content.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {content.description}
                            </p>
                          )}
                          {content.classroom && (
                            <p className="text-xs text-primary-600 mt-1">
                              {content.classroom.name}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {content.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
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
                              content.status === 'PROCESSING' ? 'animate-spin' : ''
                            }`}
                          />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {content.hasSummary && (
                            <span
                              className="p-1 bg-purple-100 rounded"
                              title="Riassunto"
                            >
                              <Wand2 className="h-3 w-3 text-purple-600" />
                            </span>
                          )}
                          {content.hasQuiz && (
                            <span
                              className="p-1 bg-green-100 rounded"
                              title="Quiz"
                            >
                              <HelpCircle className="h-3 w-3 text-green-600" />
                            </span>
                          )}
                          {content.hasConceptMap && (
                            <span
                              className="p-1 bg-orange-100 rounded"
                              title="Mappa concettuale"
                            >
                              <Map className="h-3 w-3 text-orange-600" />
                            </span>
                          )}
                          {content.hasVideoLesson && (
                            <span
                              className="p-1 bg-red-100 rounded"
                              title="Video lezione"
                            >
                              <Video className="h-3 w-3 text-red-600" />
                            </span>
                          )}
                          {!content.hasSummary &&
                            !content.hasQuiz &&
                            !content.hasConceptMap &&
                            !content.hasVideoLesson && (
                              <span className="text-xs text-gray-400">
                                Nessuna
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {formatDate(content.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setOpenMenu(openMenu === content.id ? null : content.id)
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>

                          {openMenu === content.id && (
                            <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[140px]">
                              <Link
                                href={`/dashboard/teacher/content/${content.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4" />
                                Visualizza
                              </Link>
                              <Link
                                href={`/dashboard/teacher/content/${content.id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="h-4 w-4" />
                                Modifica
                              </Link>
                              <button
                                onClick={() => {
                                  if (confirm('Eliminare questo contenuto?')) {
                                    deleteMutation.mutate(content.id);
                                  }
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                              >
                                <Trash2 className="h-4 w-4" />
                                Elimina
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
