'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Video,
  Brain,
  Map,
  ListChecks,
  Wand2,
  Loader2,
  Play,
  Trash2,
  Download,
  Share2,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contentId = params.id as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'summaries' | 'quizzes' | 'maps' | 'lessons'>('overview');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Fetch content
  const { data: content, isLoading } = useQuery({
    queryKey: ['content', contentId],
    queryFn: () => api.get(`/content/${contentId}`).then((res) => res.data),
  });

  // Parse content mutation
  const parseMutation = useMutation({
    mutationFn: () => api.post(`/content/${contentId}/parse`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
    },
  });

  // Generate summary mutation
  const summaryMutation = useMutation({
    mutationFn: () => api.post(`/content/${contentId}/summarize`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      setIsGenerating(null);
    },
  });

  // Generate concept map mutation
  const conceptMapMutation = useMutation({
    mutationFn: () => api.post(`/content/${contentId}/concept-map`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      setIsGenerating(null);
    },
  });

  // Generate quiz mutation
  const quizMutation = useMutation({
    mutationFn: (data: { type: string; numQuestions: number }) =>
      api.post(`/content/${contentId}/quiz`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      setIsGenerating(null);
    },
  });

  // Create video lesson mutation
  const videoMutation = useMutation({
    mutationFn: () => api.post('/lessons', { contentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      setIsGenerating(null);
    },
  });

  const handleGenerate = async (type: string) => {
    setIsGenerating(type);
    try {
      switch (type) {
        case 'parse':
          await parseMutation.mutateAsync();
          break;
        case 'summary':
          await summaryMutation.mutateAsync();
          break;
        case 'map':
          await conceptMapMutation.mutateAsync();
          break;
        case 'quiz':
          await quizMutation.mutateAsync({ type: 'MULTIPLE_CHOICE', numQuestions: 5 });
          break;
        case 'video':
          await videoMutation.mutateAsync();
          break;
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }
    setIsGenerating(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Contenuto non trovato</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/teacher/content"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna ai contenuti
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
                <StatusBadge status={content.status} />
              </div>
              <p className="text-gray-600">{content.description || 'Nessuna descrizione'}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {content.type}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(content.createdAt).toLocaleDateString('it-IT')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Share2 className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Download className="h-5 w-5" />
              </button>
              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="border-b flex">
                <TabButton
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  icon={<FileText className="h-4 w-4" />}
                  label="Contenuto"
                />
                <TabButton
                  active={activeTab === 'summaries'}
                  onClick={() => setActiveTab('summaries')}
                  icon={<BookOpen className="h-4 w-4" />}
                  label={`Riassunti (${content.summaries?.length || 0})`}
                />
                <TabButton
                  active={activeTab === 'quizzes'}
                  onClick={() => setActiveTab('quizzes')}
                  icon={<ListChecks className="h-4 w-4" />}
                  label={`Quiz (${content.quizzes?.length || 0})`}
                />
                <TabButton
                  active={activeTab === 'maps'}
                  onClick={() => setActiveTab('maps')}
                  icon={<Map className="h-4 w-4" />}
                  label={`Mappe (${content.conceptMaps?.length || 0})`}
                />
                <TabButton
                  active={activeTab === 'lessons'}
                  onClick={() => setActiveTab('lessons')}
                  icon={<Video className="h-4 w-4" />}
                  label={`Video (${content.videoLessons?.length || 0})`}
                />
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Testo Originale</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {content.rawContent || 'Nessun contenuto testuale'}
                      </pre>
                    </div>

                    {content.parsedData && (
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Analisi AI</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">Concetti Chiave</h4>
                            <div className="flex flex-wrap gap-2">
                              {content.parsedData.concepts?.map((c: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-green-800 mb-2">Punti Salienti</h4>
                            <ul className="text-sm text-green-700 space-y-1">
                              {content.parsedData.keyPoints?.map((p: string, i: number) => (
                                <li key={i}>• {p}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'summaries' && (
                  <div className="space-y-4">
                    {content.summaries?.length > 0 ? (
                      content.summaries.map((summary: { id: string; type: string; text: string }) => (
                        <div key={summary.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">{summary.type}</span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{summary.text}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={<BookOpen className="h-12 w-12" />}
                        title="Nessun riassunto"
                        description="Genera un riassunto con l'AI"
                      />
                    )}
                  </div>
                )}

                {activeTab === 'quizzes' && (
                  <div className="space-y-4">
                    {content.quizzes?.length > 0 ? (
                      content.quizzes.map((quiz: { id: string; title: string; type: string; questions: unknown[] }) => (
                        <div key={quiz.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                              <p className="text-sm text-gray-500">
                                {quiz.questions?.length || 0} domande • {quiz.type}
                              </p>
                            </div>
                            <Link
                              href={`/dashboard/teacher/quizzes/${quiz.id}`}
                              className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                            >
                              Visualizza
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={<ListChecks className="h-12 w-12" />}
                        title="Nessun quiz"
                        description="Genera un quiz con l'AI"
                      />
                    )}
                  </div>
                )}

                {activeTab === 'maps' && (
                  <div className="space-y-4">
                    {content.conceptMaps?.length > 0 ? (
                      content.conceptMaps.map((map: { id: string; title: string; nodes: unknown[] }) => (
                        <div key={map.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{map.title}</h4>
                              <p className="text-sm text-gray-500">
                                {map.nodes?.length || 0} nodi
                              </p>
                            </div>
                            <Link
                              href={`/dashboard/teacher/maps/${map.id}`}
                              className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                            >
                              Visualizza
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={<Map className="h-12 w-12" />}
                        title="Nessuna mappa"
                        description="Genera una mappa concettuale con l'AI"
                      />
                    )}
                  </div>
                )}

                {activeTab === 'lessons' && (
                  <div className="space-y-4">
                    {content.videoLessons?.length > 0 ? (
                      content.videoLessons.map((lesson: { id: string; title: string; status: string; videoUrl?: string; duration?: number }) => (
                        <div key={lesson.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                {lesson.status === 'READY' ? (
                                  <Play className="h-8 w-8 text-gray-400" />
                                ) : (
                                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                                <p className="text-sm text-gray-500">
                                  {lesson.status === 'READY'
                                    ? `${lesson.duration || 0}s`
                                    : lesson.status}
                                </p>
                              </div>
                            </div>
                            {lesson.status === 'READY' && (
                              <Link
                                href={`/dashboard/teacher/lessons/${lesson.id}`}
                                className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                              >
                                Apri
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={<Video className="h-12 w-12" />}
                        title="Nessuna video-lezione"
                        description="Genera una video-lezione con l'AI"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - AI Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary-600" />
                Genera con AI
              </h2>

              <div className="space-y-3">
                {content.status !== 'READY' && (
                  <AIActionButton
                    icon={<Brain className="h-5 w-5" />}
                    label="Analizza Contenuto"
                    description="Estrai concetti e punti chiave"
                    onClick={() => handleGenerate('parse')}
                    loading={isGenerating === 'parse'}
                    color="blue"
                  />
                )}

                <AIActionButton
                  icon={<BookOpen className="h-5 w-5" />}
                  label="Genera Riassunto"
                  description="Crea riassunti (anche DSA/L2)"
                  onClick={() => handleGenerate('summary')}
                  loading={isGenerating === 'summary'}
                  color="green"
                />

                <AIActionButton
                  icon={<Map className="h-5 w-5" />}
                  label="Mappa Concettuale"
                  description="Crea mappa interattiva"
                  onClick={() => handleGenerate('map')}
                  loading={isGenerating === 'map'}
                  color="purple"
                />

                <AIActionButton
                  icon={<ListChecks className="h-5 w-5" />}
                  label="Genera Quiz"
                  description="Crea domande di verifica"
                  onClick={() => handleGenerate('quiz')}
                  loading={isGenerating === 'quiz'}
                  color="orange"
                />

                <div className="border-t pt-3 mt-3">
                  <AIActionButton
                    icon={<Video className="h-5 w-5" />}
                    label="Crea Video-Lezione"
                    description="Genera video con avatar parlante"
                    onClick={() => handleGenerate('video')}
                    loading={isGenerating === 'video'}
                    color="red"
                    primary
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistiche</h2>
              <div className="space-y-3">
                <StatRow label="Riassunti" value={content.summaries?.length || 0} />
                <StatRow label="Quiz" value={content.quizzes?.length || 0} />
                <StatRow label="Mappe" value={content.conceptMaps?.length || 0} />
                <StatRow label="Video" value={content.videoLessons?.length || 0} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function AIActionButton({
  icon,
  label,
  description,
  onClick,
  loading,
  color,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  loading: boolean;
  color: string;
  primary?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    red: primary
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-red-50 text-red-600 hover:bg-red-100',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full p-3 rounded-lg text-left transition-colors ${colors[color]} disabled:opacity-50`}
    >
      <div className="flex items-center gap-3">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
        <div>
          <p className="font-medium">{label}</p>
          <p className={`text-xs ${primary ? 'text-red-100' : 'opacity-70'}`}>{description}</p>
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
    DRAFT: { bg: 'bg-gray-100 text-gray-600', icon: null },
    PROCESSING: { bg: 'bg-yellow-100 text-yellow-600', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    READY: { bg: 'bg-green-100 text-green-600', icon: <CheckCircle className="h-3 w-3" /> },
    ERROR: { bg: 'bg-red-100 text-red-600', icon: <AlertCircle className="h-3 w-3" /> },
  };

  const style = styles[status] || styles.DRAFT;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${style.bg}`}>
      {style.icon}
      {status}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-8">
      <div className="text-gray-300 mb-3 flex justify-center">{icon}</div>
      <h4 className="font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
