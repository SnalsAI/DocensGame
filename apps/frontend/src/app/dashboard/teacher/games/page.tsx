'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Gamepad2,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  MoreVertical,
  Users,
  Clock,
  Trophy,
  Zap,
  Sword,
  Puzzle,
  BarChart2,
  Trash2,
  Copy,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

type GameSession = {
  id: string;
  roomCode: string;
  gameType: 'RAPID_QUIZ' | 'BOSS_FIGHT' | 'SQUAD_PUZZLE' | 'TOURNAMENT';
  status: 'WAITING' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED';
  numQuestions: number;
  timePerQuestion: number;
  playerCount: number;
  classroom?: { name: string };
  content?: { title: string };
  createdAt: string;
  finishedAt?: string;
};

const GAME_TYPE_CONFIG = {
  RAPID_QUIZ: { name: 'Rapid Quiz', icon: Zap, color: 'yellow' },
  BOSS_FIGHT: { name: 'Boss Fight', icon: Sword, color: 'red' },
  SQUAD_PUZZLE: { name: 'Squad Puzzle', icon: Puzzle, color: 'blue' },
  TOURNAMENT: { name: 'Tournament', icon: Trophy, color: 'purple' },
};

const STATUS_CONFIG = {
  WAITING: { label: 'In attesa', color: 'gray' },
  IN_PROGRESS: { label: 'In corso', color: 'green' },
  PAUSED: { label: 'In pausa', color: 'yellow' },
  FINISHED: { label: 'Terminato', color: 'blue' },
};

export default function GamesListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Fetch games
  const { data: games, isLoading } = useQuery<GameSession[]>({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then((res) => res.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/games/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setOpenMenu(null);
    },
  });

  // Filter games
  const filteredGames = games?.filter((game) => {
    const matchesSearch =
      game.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.classroom?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.content?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || game.gameType === typeFilter;
    const matchesStatus = !statusFilter || game.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeGames = games?.filter((g) => g.status === 'IN_PROGRESS' || g.status === 'WAITING') || [];
  const finishedGames = games?.filter((g) => g.status === 'FINISHED') || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Giochi</h1>
            <p className="text-gray-600 mt-1">
              Crea e gestisci sessioni di gioco multiplayer per la tua classe
            </p>
          </div>
          <Link
            href="/dashboard/teacher/games/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuovo Gioco
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Gamepad2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {games?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Totali</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {activeGames.length}
                </p>
                <p className="text-sm text-gray-500">Attivi</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {finishedGames.length}
                </p>
                <p className="text-sm text-gray-500">Completati</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {games?.reduce((acc, g) => acc + g.playerCount, 0) || 0}
                </p>
                <p className="text-sm text-gray-500">Partecipanti totali</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Games Banner */}
        {activeGames.length > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {activeGames.length} gioco/i attivo/i
                  </h3>
                  <p className="text-white/80 text-sm">
                    {activeGames
                      .map((g) => `${g.roomCode} (${g.playerCount} giocatori)`)
                      .join(' • ')}
                  </p>
                </div>
              </div>
              {activeGames.length === 1 && (
                <Link
                  href={`/dashboard/teacher/games/${activeGames[0].id}/host`}
                  className="px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100"
                >
                  Vai al Gioco
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per codice, classe o contenuto..."
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
                <option value="RAPID_QUIZ">Rapid Quiz</option>
                <option value="BOSS_FIGHT">Boss Fight</option>
                <option value="SQUAD_PUZZLE">Squad Puzzle</option>
                <option value="TOURNAMENT">Tournament</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tutti gli stati</option>
                <option value="WAITING">In attesa</option>
                <option value="IN_PROGRESS">In corso</option>
                <option value="PAUSED">In pausa</option>
                <option value="FINISHED">Terminato</option>
              </select>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : filteredGames?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun gioco trovato
            </h3>
            <p className="text-gray-500 mb-4">
              Crea il tuo primo gioco multiplayer per la classe
            </p>
            <Link
              href="/dashboard/teacher/games/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Nuovo Gioco
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames?.map((game) => {
              const typeConfig = GAME_TYPE_CONFIG[game.gameType];
              const statusConfig = STATUS_CONFIG[game.status];
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={game.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className={`p-4 ${
                      typeConfig.color === 'yellow'
                        ? 'bg-yellow-500'
                        : typeConfig.color === 'red'
                        ? 'bg-red-500'
                        : typeConfig.color === 'blue'
                        ? 'bg-blue-500'
                        : 'bg-purple-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="h-6 w-6 text-white" />
                        <span className="text-white font-semibold">
                          {typeConfig.name}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusConfig.color === 'gray'
                            ? 'bg-white/20 text-white'
                            : statusConfig.color === 'green'
                            ? 'bg-green-200 text-green-800'
                            : statusConfig.color === 'yellow'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {/* Room Code */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500">Codice</p>
                        <p className="text-xl font-mono font-bold text-gray-900">
                          {game.roomCode}
                        </p>
                      </div>
                      <button
                        onClick={() => copyRoomCode(game.roomCode)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Copia codice"
                      >
                        <Copy className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
                      {game.classroom && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{game.classroom.name}</span>
                        </div>
                      )}
                      {game.content && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <BarChart2 className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{game.content.title}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {game.timePerQuestion}s/domanda
                        </span>
                        <span>{game.numQuestions} domande</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between py-3 border-t">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{game.playerCount}</span>
                        <span className="text-gray-400">giocatori</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {formatDate(game.createdAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t">
                      {(game.status === 'WAITING' || game.status === 'IN_PROGRESS' || game.status === 'PAUSED') && (
                        <Link
                          href={`/dashboard/teacher/games/${game.id}/host`}
                          className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium text-center hover:bg-primary-700"
                        >
                          {game.status === 'WAITING' ? 'Avvia' : 'Gestisci'}
                        </Link>
                      )}
                      {game.status === 'FINISHED' && (
                        <Link
                          href={`/dashboard/teacher/games/${game.id}/results`}
                          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-center hover:bg-gray-200"
                        >
                          Risultati
                        </Link>
                      )}

                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenu(openMenu === game.id ? null : game.id)
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-400" />
                        </button>

                        {openMenu === game.id && (
                          <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[140px]">
                            <Link
                              href={`/dashboard/teacher/games/${game.id}/results`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <BarChart2 className="h-4 w-4" />
                              Statistiche
                            </Link>
                            <button
                              onClick={() => copyRoomCode(game.roomCode)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                            >
                              <Copy className="h-4 w-4" />
                              Copia Codice
                            </button>
                            {game.status !== 'IN_PROGRESS' && (
                              <button
                                onClick={() => {
                                  if (confirm('Eliminare questo gioco?')) {
                                    deleteMutation.mutate(game.id);
                                  }
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                              >
                                <Trash2 className="h-4 w-4" />
                                Elimina
                              </button>
                            )}
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
