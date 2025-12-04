'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft,
  Gamepad2,
  Zap,
  Sword,
  Puzzle,
  Trophy,
  Settings,
  Users,
  Clock,
  Loader2,
  Copy,
  Play,
} from 'lucide-react';

const GAME_TYPES = [
  {
    type: 'RAPID_QUIZ',
    name: 'Rapid Quiz',
    description: 'Quiz veloce con domande a tempo. Vince chi risponde più velocemente e correttamente!',
    icon: Zap,
    color: 'yellow',
  },
  {
    type: 'BOSS_FIGHT',
    name: 'Boss Fight',
    description: 'La classe collabora per sconfiggere un boss rispondendo alle domande!',
    icon: Sword,
    color: 'red',
  },
  {
    type: 'SQUAD_PUZZLE',
    name: 'Squad Puzzle',
    description: 'Divide la classe in squadre per risolvere puzzle collaborativi.',
    icon: Puzzle,
    color: 'blue',
  },
  {
    type: 'TOURNAMENT',
    name: 'Tournament',
    description: 'Torneo ad eliminazione diretta per sfide intense!',
    icon: Trophy,
    color: 'purple',
  },
];

export default function NewGamePage() {
  const router = useRouter();

  const [selectedType, setSelectedType] = useState('RAPID_QUIZ');
  const [classroomId, setClassroomId] = useState('');
  const [contentId, setContentId] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(20);
  const [dsaExtraTime, setDsaExtraTime] = useState(50);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [allowLateJoin, setAllowLateJoin] = useState(false);

  const [createdGame, setCreatedGame] = useState<{
    id: string;
    roomCode: string;
  } | null>(null);

  // Fetch classrooms
  const { data: classrooms } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => api.get('/classrooms').then((res) => res.data),
  });

  // Fetch contents
  const { data: contents } = useQuery({
    queryKey: ['contents'],
    queryFn: () => api.get('/content').then((res) => res.data),
  });

  // Create game mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post('/games', data);
      return response.data;
    },
    onSuccess: (data) => {
      setCreatedGame({ id: data.id, roomCode: data.roomCode });
    },
  });

  const handleCreate = () => {
    if (!classroomId) {
      alert('Seleziona una classe');
      return;
    }

    createMutation.mutate({
      gameType: selectedType,
      classroomId,
      contentId: contentId || undefined,
      numQuestions,
      timePerQuestion,
      showLeaderboard,
      allowLateJoin,
      dsaExtraTime,
    });
  };

  const copyRoomCode = () => {
    if (createdGame) {
      navigator.clipboard.writeText(createdGame.roomCode);
    }
  };

  const startGame = () => {
    if (createdGame) {
      router.push(`/dashboard/teacher/games/${createdGame.id}/host`);
    }
  };

  // If game is created, show the room code screen
  if (createdGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gioco Creato!</h1>
          <p className="text-gray-600 mb-6">
            Condividi il codice con i tuoi studenti
          </p>

          <div className="bg-gray-100 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-500 mb-2">Codice Stanza</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-mono font-bold tracking-widest text-gray-900">
                {createdGame.roomCode}
              </span>
              <button
                onClick={copyRoomCode}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copia codice"
              >
                <Copy className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Gli studenti possono unirsi andando su{' '}
            <span className="font-medium text-primary-600">game/join</span>
          </p>

          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="h-5 w-5" />
              Avvia Gioco
            </button>
            <Link
              href="/dashboard/teacher/games"
              className="block w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Torna alla Lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/teacher/games"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna ai giochi
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nuovo Gioco</h1>
          <p className="text-gray-600 mt-1">
            Crea una sessione di gioco multiplayer per la tua classe
          </p>
        </div>

        {/* Game Type Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tipo di Gioco
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {GAME_TYPES.map((game) => (
              <button
                key={game.type}
                onClick={() => setSelectedType(game.type)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedType === game.type
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <game.icon
                  className={`h-8 w-8 mb-2 ${
                    selectedType === game.type
                      ? 'text-primary-600'
                      : 'text-gray-400'
                  }`}
                />
                <p className="font-semibold text-gray-900">{game.name}</p>
                <p className="text-sm text-gray-500 mt-1">{game.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Impostazioni
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Classroom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="h-4 w-4 inline mr-1" />
                Classe *
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Seleziona una classe</option>
                {classrooms?.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenuto (opzionale)
              </label>
              <select
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Genera domande casuali</option>
                {contents?.map((c: { id: string; title: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero Domande
              </label>
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                min={5}
                max={50}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Time per question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Secondi per Domanda
              </label>
              <input
                type="number"
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                min={10}
                max={120}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* DSA Extra Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Extra DSA (%)
              </label>
              <input
                type="number"
                value={dsaExtraTime}
                onChange={(e) => setDsaExtraTime(parseInt(e.target.value))}
                min={0}
                max={200}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Gli studenti DSA avranno {dsaExtraTime}% di tempo in più
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLeaderboard}
                  onChange={(e) => setShowLeaderboard(e.target.checked)}
                  className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  Mostra classifica in tempo reale
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowLateJoin}
                  onChange={(e) => setAllowLateJoin(e.target.checked)}
                  className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  Permetti ingresso tardivo
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/teacher/games"
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </Link>
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending || !classroomId}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creazione...
              </>
            ) : (
              <>
                <Gamepad2 className="h-4 w-4" />
                Crea Gioco
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
