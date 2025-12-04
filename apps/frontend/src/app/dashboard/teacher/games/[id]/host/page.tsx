'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  Users,
  Trophy,
  Clock,
  Zap,
  Target,
  BarChart2,
  Settings,
  Volume2,
  VolumeX,
  Crown,
  Medal,
  Award,
  Loader2,
  Check,
  X,
  RefreshCw,
  StopCircle,
  AlertTriangle,
} from 'lucide-react';

type Player = {
  oderId: string;
  odername: string;
  avatarUrl?: string;
  score: number;
  streak: number;
  isOnline: boolean;
  isDsa: boolean;
  lastAnswerCorrect?: boolean;
  responseTime?: number;
};

type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  points: number;
};

type GameState = {
  status: 'WAITING' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED';
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  players: Player[];
  currentQuestion?: Question;
  answersReceived: number;
  questionStartTime?: number;
};

export default function GameHostPage() {
  const params = useParams();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    status: 'WAITING',
    currentQuestionIndex: 0,
    totalQuestions: 10,
    timeRemaining: 0,
    players: [],
    answersReceived: 0,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAnswerStats, setShowAnswerStats] = useState(false);
  const [answerDistribution, setAnswerDistribution] = useState<number[]>([0, 0, 0, 0]);

  // Fetch game details
  const { data: game, isLoading } = useQuery({
    queryKey: ['game', params.id],
    queryFn: () => api.get(`/games/${params.id}`).then((res) => res.data),
  });

  // Socket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      query: { gameId: params.id, role: 'host' },
    });

    newSocket.on('connect', () => {
      console.log('Host connected');
      newSocket.emit('host_join', { gameId: params.id });
    });

    newSocket.on('player_joined', (player: Player) => {
      setGameState((prev) => ({
        ...prev,
        players: [...prev.players.filter((p) => p.oderId !== player.oderId), player],
      }));
    });

    newSocket.on('player_left', (playerId: string) => {
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.oderId === playerId ? { ...p, isOnline: false } : p
        ),
      }));
    });

    newSocket.on('game_state_update', (state: Partial<GameState>) => {
      setGameState((prev) => ({ ...prev, ...state }));
    });

    newSocket.on('answer_received', (data: { playerId: string; answerIndex: number; correct: boolean; responseTime: number }) => {
      setGameState((prev) => ({
        ...prev,
        answersReceived: prev.answersReceived + 1,
        players: prev.players.map((p) =>
          p.oderId === data.playerId
            ? {
                ...p,
                lastAnswerCorrect: data.correct,
                responseTime: data.responseTime,
                score: data.correct ? p.score + calculatePoints(data.responseTime) : p.score,
                streak: data.correct ? p.streak + 1 : 0,
              }
            : p
        ),
      }));
      setAnswerDistribution((prev) => {
        const newDist = [...prev];
        newDist[data.answerIndex]++;
        return newDist;
      });
    });

    newSocket.on('question_ended', () => {
      setShowAnswerStats(true);
    });

    newSocket.on('game_finished', (finalState: GameState) => {
      setGameState((prev) => ({ ...prev, ...finalState, status: 'FINISHED' }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [params.id]);

  // Timer effect
  useEffect(() => {
    if (gameState.status !== 'IN_PROGRESS' || gameState.timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          socket?.emit('question_timeout', { gameId: params.id });
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.status, gameState.timeRemaining, socket, params.id]);

  const calculatePoints = (responseTime: number) => {
    const basePoints = 1000;
    const timeBonus = Math.max(0, 500 - responseTime * 10);
    return Math.round(basePoints + timeBonus);
  };

  const startGame = () => {
    socket?.emit('start_game', { gameId: params.id });
    setGameState((prev) => ({ ...prev, status: 'IN_PROGRESS' }));
  };

  const pauseGame = () => {
    socket?.emit('pause_game', { gameId: params.id });
    setGameState((prev) => ({ ...prev, status: 'PAUSED' }));
  };

  const resumeGame = () => {
    socket?.emit('resume_game', { gameId: params.id });
    setGameState((prev) => ({ ...prev, status: 'IN_PROGRESS' }));
  };

  const nextQuestion = () => {
    setShowAnswerStats(false);
    setAnswerDistribution([0, 0, 0, 0]);
    socket?.emit('next_question', { gameId: params.id });
    setGameState((prev) => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      answersReceived: 0,
    }));
  };

  const endGame = () => {
    if (confirm('Sei sicuro di voler terminare il gioco?')) {
      socket?.emit('end_game', { gameId: params.id });
    }
  };

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const onlinePlayers = gameState.players.filter((p) => p.isOnline);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Waiting Room
  if (gameState.status === 'WAITING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/dashboard/teacher/games"
              className="text-white/70 hover:text-white flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Torna ai giochi
            </Link>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {/* Room Code */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              {game?.name || 'Gioco'}
            </h1>
            <p className="text-white/70 mb-8">
              Gli studenti possono unirsi con il codice
            </p>

            <div className="inline-block bg-white rounded-2xl px-12 py-6 shadow-xl">
              <p className="text-sm text-gray-500 mb-2">Codice Stanza</p>
              <p className="text-5xl font-mono font-bold tracking-widest text-gray-900">
                {game?.roomCode || '------'}
              </p>
            </div>

            <p className="text-white/70 mt-4">
              game/join
            </p>
          </div>

          {/* Players Grid */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Giocatori ({onlinePlayers.length})
              </h2>
              <button
                onClick={() => socket?.emit('refresh_players', { gameId: params.id })}
                className="p-2 text-white/70 hover:text-white"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {onlinePlayers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/70">
                  In attesa che i giocatori si uniscano...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {onlinePlayers.map((player) => (
                  <div
                    key={player.oderId}
                    className="bg-white/20 rounded-xl p-3 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg">
                      {player.odername.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-white text-sm truncate">{player.odername}</p>
                    {player.isDsa && (
                      <span className="text-xs bg-yellow-400 text-yellow-900 px-1 rounded">
                        DSA
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={startGame}
              disabled={onlinePlayers.length === 0}
              className="px-12 py-4 bg-white text-primary-600 rounded-xl font-bold text-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
            >
              <Play className="h-6 w-6" />
              Inizia Gioco
            </button>
            {onlinePlayers.length === 0 && (
              <p className="text-white/70 mt-2 text-sm">
                Attendi almeno un giocatore per iniziare
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game Finished
  if (gameState.status === 'FINISHED') {
    const top3 = sortedPlayers.slice(0, 3);

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <Trophy className="h-20 w-20 text-white mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">
              Gioco Terminato!
            </h1>
            <p className="text-white/80">
              {gameState.totalQuestions} domande completate
            </p>
          </div>

          {/* Podium */}
          <div className="flex items-end justify-center gap-4 mb-12">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="text-center">
                <div className="bg-gray-400 rounded-t-xl w-28 h-24 flex items-center justify-center">
                  <Medal className="h-10 w-10 text-white" />
                </div>
                <div className="bg-white/20 backdrop-blur rounded-b-xl p-4">
                  <p className="text-white font-semibold">{top3[1].odername}</p>
                  <p className="text-white/80 text-2xl font-bold">
                    {top3[1].score.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div className="text-center -mt-8">
                <div className="bg-yellow-400 rounded-t-xl w-32 h-32 flex items-center justify-center">
                  <Crown className="h-14 w-14 text-yellow-800" />
                </div>
                <div className="bg-white/20 backdrop-blur rounded-b-xl p-4">
                  <p className="text-white font-semibold text-lg">{top3[0].odername}</p>
                  <p className="text-white text-3xl font-bold">
                    {top3[0].score.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="text-center">
                <div className="bg-amber-700 rounded-t-xl w-28 h-20 flex items-center justify-center">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="bg-white/20 backdrop-blur rounded-b-xl p-4">
                  <p className="text-white font-semibold">{top3[2].odername}</p>
                  <p className="text-white/80 text-xl font-bold">
                    {top3[2].score.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Full Leaderboard */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Classifica Completa
            </h2>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.oderId}
                  className="flex items-center gap-4 bg-white/10 rounded-lg p-3"
                >
                  <span className="w-8 text-center font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-white">{player.odername}</span>
                  <span className="text-white font-bold">
                    {player.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard/teacher/games"
              className="px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30"
            >
              Torna ai Giochi
            </Link>
            <Link
              href={`/dashboard/teacher/games/${params.id}/results`}
              className="px-6 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-100"
            >
              Vedi Statistiche Dettagliate
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Game In Progress
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-semibold">{game?.name}</h1>
            <span className="px-3 py-1 bg-primary-600 text-white text-sm rounded-full">
              {game?.roomCode}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">
              Domanda {gameState.currentQuestionIndex + 1} di {gameState.totalQuestions}
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-gray-400 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button
              onClick={endGame}
              className="p-2 text-red-400 hover:text-red-300"
              title="Termina gioco"
            >
              <StopCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer & Progress */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary-400" />
                  <span className="text-4xl font-bold text-white">
                    {gameState.timeRemaining}s
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {gameState.status === 'PAUSED' ? (
                    <button
                      onClick={resumeGame}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Riprendi
                    </button>
                  ) : (
                    <button
                      onClick={pauseGame}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                    >
                      <Pause className="h-4 w-4" />
                      Pausa
                    </button>
                  )}
                  <button
                    onClick={nextQuestion}
                    disabled={gameState.currentQuestionIndex >= gameState.totalQuestions - 1}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <SkipForward className="h-4 w-4" />
                    Prossima
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{
                    width: `${((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Current Question */}
            <div className="bg-gray-800 rounded-xl p-6">
              {gameState.currentQuestion ? (
                <>
                  <h2 className="text-2xl font-semibold text-white mb-6">
                    {gameState.currentQuestion.text}
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    {gameState.currentQuestion.options.map((option, idx) => {
                      const colors = [
                        'bg-red-600 hover:bg-red-700',
                        'bg-blue-600 hover:bg-blue-700',
                        'bg-yellow-600 hover:bg-yellow-700',
                        'bg-green-600 hover:bg-green-700',
                      ];

                      const isCorrect = idx === gameState.currentQuestion?.correctAnswer;
                      const percentage = gameState.answersReceived > 0
                        ? Math.round((answerDistribution[idx] / gameState.answersReceived) * 100)
                        : 0;

                      return (
                        <div
                          key={idx}
                          className={`relative p-4 rounded-xl ${colors[idx]} ${
                            showAnswerStats && isCorrect ? 'ring-4 ring-white' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-lg">
                              {String.fromCharCode(65 + idx)}. {option}
                            </span>
                            {showAnswerStats && (
                              <span className="text-white font-bold">
                                {percentage}%
                              </span>
                            )}
                          </div>
                          {showAnswerStats && isCorrect && (
                            <Check className="absolute top-2 right-2 h-6 w-6 text-white" />
                          )}

                          {/* Answer distribution bar */}
                          {showAnswerStats && (
                            <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-white transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-400 mx-auto mb-4" />
                  <p className="text-gray-400">Caricamento domanda...</p>
                </div>
              )}
            </div>

            {/* Answer Stats */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary-400" />
                  Risposte Ricevute
                </h3>
                <span className="text-2xl font-bold text-white">
                  {gameState.answersReceived}/{onlinePlayers.length}
                </span>
              </div>

              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: `${(gameState.answersReceived / Math.max(onlinePlayers.length, 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Recent answers */}
              <div className="mt-4 flex flex-wrap gap-2">
                {gameState.players
                  .filter((p) => p.lastAnswerCorrect !== undefined)
                  .slice(-10)
                  .map((player) => (
                    <div
                      key={player.oderId}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        player.lastAnswerCorrect
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-red-600/20 text-red-400'
                      }`}
                    >
                      {player.lastAnswerCorrect ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {player.odername}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="space-y-6">
            {/* Online Players */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-400" />
                Online ({onlinePlayers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {onlinePlayers.map((player) => (
                  <div
                    key={player.oderId}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold text-sm"
                    title={player.odername}
                  >
                    {player.odername.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Classifica
              </h3>

              <div className="space-y-2">
                {sortedPlayers.slice(0, 10).map((player, index) => (
                  <div
                    key={player.oderId}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      index === 0
                        ? 'bg-yellow-600/20'
                        : index === 1
                        ? 'bg-gray-400/20'
                        : index === 2
                        ? 'bg-amber-700/20'
                        : 'bg-gray-700/50'
                    }`}
                  >
                    <span
                      className={`w-6 text-center font-bold ${
                        index === 0
                          ? 'text-yellow-400'
                          : index === 1
                          ? 'text-gray-300'
                          : index === 2
                          ? 'text-amber-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate flex items-center gap-1">
                        {player.odername}
                        {player.isDsa && (
                          <span className="text-xs bg-yellow-400/20 text-yellow-400 px-1 rounded">
                            DSA
                          </span>
                        )}
                      </p>
                      {player.streak > 2 && (
                        <p className="text-xs text-orange-400 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {player.streak} di fila
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-white font-bold">
                        {player.score.toLocaleString()}
                      </p>
                      {player.lastAnswerCorrect !== undefined && (
                        <p className="text-xs">
                          {player.lastAnswerCorrect ? (
                            <span className="text-green-400">+{calculatePoints(player.responseTime || 0)}</span>
                          ) : (
                            <span className="text-red-400">+0</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" />
                Statistiche
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tasso risposte corrette</span>
                  <span className="text-white font-medium">
                    {gameState.answersReceived > 0
                      ? Math.round(
                          (gameState.players.filter((p) => p.lastAnswerCorrect).length /
                            gameState.answersReceived) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tempo medio risposta</span>
                  <span className="text-white font-medium">
                    {gameState.players.filter((p) => p.responseTime).length > 0
                      ? (
                          gameState.players
                            .filter((p) => p.responseTime)
                            .reduce((acc, p) => acc + (p.responseTime || 0), 0) /
                          gameState.players.filter((p) => p.responseTime).length
                        ).toFixed(1)
                      : 0}
                    s
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Streak più lunga</span>
                  <span className="text-white font-medium">
                    {Math.max(...gameState.players.map((p) => p.streak), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paused Overlay */}
      {gameState.status === 'PAUSED' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Gioco in Pausa</h2>
            <p className="text-gray-400 mb-6">Il gioco è stato messo in pausa</p>
            <button
              onClick={resumeGame}
              className="px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 flex items-center gap-2 mx-auto"
            >
              <Play className="h-5 w-5" />
              Riprendi Gioco
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
