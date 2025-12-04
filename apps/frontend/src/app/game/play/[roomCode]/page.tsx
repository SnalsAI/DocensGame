'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/store/game-store';
import { getGameSocket, connectGameSocket, disconnectGameSocket } from '@/lib/socket';
import {
  Trophy,
  Clock,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  Crown,
  Loader2,
} from 'lucide-react';

export default function GamePlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const roomCode = params.roomCode as string;
  const nickname = searchParams.get('nickname') || '';

  const {
    status,
    currentQuestion,
    extraTimePercent,
    lastAnswer,
    leaderboard,
    results,
    participantId,
    setStatus,
    setCurrentQuestion,
    setExtraTimePercent,
    setLastAnswer,
    updateLeaderboard,
    setResults,
    setParticipantId,
    reset,
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Connect to game socket
  useEffect(() => {
    const connect = async () => {
      try {
        await connectGameSocket();
        const socket = getGameSocket();

        // Join room
        socket.emit('join_room', {
          roomCode,
          odisplayname: user?.id || `guest-${Date.now()}`,
          nickname: nickname || `${user?.firstName || 'Ospite'}`,
        });

        // Event handlers
        socket.on('game_state', (state) => {
          setStatus(state.status === 'WAITING' ? 'waiting' : state.status === 'IN_PROGRESS' ? 'playing' : 'idle');
          setExtraTimePercent(state.extraTimePercent || 0);
        });

        socket.on('player_joined', (data) => {
          if (data.participantId) {
            setParticipantId(data.participantId);
          }
        });

        socket.on('game_started', () => {
          setStatus('starting');
          setTimeout(() => setStatus('playing'), 3000);
        });

        socket.on('question', (question) => {
          setCurrentQuestion(question);
          setSelectedAnswer(null);
          setAnswerSubmitted(false);
          setLastAnswer(null);

          // Calculate time with extra time for DSA
          const baseTime = question.timeLimit;
          const extraTime = Math.round(baseTime * (extraTimePercent / 100));
          setTimeLeft(baseTime + extraTime);
        });

        socket.on('answer_result', (result) => {
          setLastAnswer(result);
        });

        socket.on('leaderboard_update', (lb) => {
          updateLeaderboard(lb);
        });

        socket.on('game_finished', (res) => {
          setResults(res);
          setStatus('finished');
        });

        socket.on('error', (err) => {
          setConnectionError(err.message);
        });
      } catch (error) {
        setConnectionError('Impossibile connettersi al server di gioco');
      }
    };

    connect();

    return () => {
      disconnectGameSocket();
      reset();
    };
  }, [roomCode, user, nickname]);

  // Timer countdown
  useEffect(() => {
    if (status !== 'playing' || timeLeft <= 0 || answerSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Auto-submit if time runs out
          if (!answerSubmitted && selectedAnswer) {
            handleSubmitAnswer();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft, answerSubmitted, selectedAnswer]);

  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion || answerSubmitted || !selectedAnswer) return;

    const socket = getGameSocket();
    const timeSpent = currentQuestion.timeLimit - timeLeft;

    socket.emit('submit_answer', {
      roomCode,
      participantId,
      questionId: currentQuestion.questionId,
      answer: selectedAnswer,
      timeSpent,
    });

    setAnswerSubmitted(true);
  }, [currentQuestion, answerSubmitted, selectedAnswer, timeLeft, roomCode, participantId]);

  // Render based on status
  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Errore di Connessione</h1>
          <p className="text-gray-400">{connectionError}</p>
        </div>
      </div>
    );
  }

  if (status === 'idle' || status === 'waiting') {
    return <WaitingScreen roomCode={roomCode} leaderboard={leaderboard} />;
  }

  if (status === 'starting') {
    return <CountdownScreen />;
  }

  if (status === 'finished' && results) {
    return <ResultsScreen results={results} />;
  }

  if (status === 'playing' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 to-purple-900 p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-white/60 text-sm">Domanda</span>
              <p className="text-white font-bold">
                {currentQuestion.questionNumber}/{currentQuestion.totalQuestions}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-white/60 text-sm">Punti</span>
              <p className="text-yellow-400 font-bold">{currentQuestion.points}</p>
            </div>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-6 py-3 rounded-full ${
              timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-white/10 backdrop-blur'
            }`}
          >
            <Clock className="h-5 w-5 text-white" />
            <span className="text-2xl font-bold text-white">{timeLeft}s</span>
          </div>
        </div>

        {/* Question */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl p-8 mb-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              {currentQuestion.questionText}
            </h2>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !answerSubmitted && setSelectedAnswer(option)}
                disabled={answerSubmitted}
                className={`p-6 rounded-xl text-left text-lg font-medium transition-all transform hover:scale-102 ${
                  answerSubmitted
                    ? option === lastAnswer?.correctAnswer
                      ? 'bg-green-500 text-white'
                      : option === selectedAnswer && !lastAnswer?.isCorrect
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 text-gray-400'
                    : selectedAnswer === option
                    ? 'bg-primary-500 text-white scale-102 shadow-lg'
                    : 'bg-white hover:bg-primary-50 text-gray-900'
                }`}
              >
                <span className="inline-block w-8 h-8 rounded-full bg-gray-200 text-center leading-8 mr-3 text-gray-600">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            ))}
          </div>

          {/* Submit / Result */}
          {!answerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="w-full mt-6 py-4 bg-yellow-400 text-gray-900 rounded-xl font-bold text-xl hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Conferma Risposta
            </button>
          ) : lastAnswer ? (
            <div
              className={`mt-6 p-6 rounded-xl ${
                lastAnswer.isCorrect ? 'bg-green-500' : 'bg-red-500'
              } text-white text-center`}
            >
              <div className="flex items-center justify-center gap-3">
                {lastAnswer.isCorrect ? (
                  <CheckCircle className="h-8 w-8" />
                ) : (
                  <XCircle className="h-8 w-8" />
                )}
                <span className="text-2xl font-bold">
                  {lastAnswer.isCorrect ? 'Corretto!' : 'Sbagliato!'}
                </span>
                <span className="text-xl">+{lastAnswer.points} punti</span>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-6 rounded-xl bg-white/10 text-white text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2">Attendendo la prossima domanda...</p>
            </div>
          )}
        </div>

        {/* Mini Leaderboard */}
        <div className="fixed bottom-4 right-4 bg-white/10 backdrop-blur rounded-xl p-4 w-64">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            Classifica
          </h3>
          <div className="space-y-1">
            {leaderboard.slice(0, 5).map((player, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm text-white/80"
              >
                <span>
                  {index === 0 && <Crown className="h-3 w-3 inline text-yellow-400 mr-1" />}
                  {player.displayName}
                </span>
                <span className="font-bold">{player.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function WaitingScreen({
  roomCode,
  leaderboard,
}: {
  roomCode: string;
  leaderboard: Array<{ displayName: string; score: number }>;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stanza: {roomCode}</h1>
          <p className="text-gray-600 mb-6">In attesa che il docente avvii il gioco...</p>

          <div className="flex items-center justify-center gap-2 text-primary-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Connesso</span>
          </div>
        </div>

        {leaderboard.length > 0 && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 max-w-md mx-auto">
            <h2 className="text-white font-semibold mb-4 flex items-center justify-center gap-2">
              <Users className="h-5 w-5" />
              Giocatori ({leaderboard.length})
            </h2>
            <div className="space-y-2">
              {leaderboard.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-white/90 bg-white/10 rounded-lg px-4 py-2"
                >
                  <span className="w-6 text-center font-bold">{index + 1}</span>
                  <span>{player.displayName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CountdownScreen() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-9xl font-bold text-white animate-pulse">
          {count > 0 ? count : 'VIA!'}
        </div>
        <p className="text-white/60 text-xl mt-4">Preparati...</p>
      </div>
    </div>
  );
}

function ResultsScreen({
  results,
}: {
  results: {
    session: { gameType: string; totalQuestions: number };
    leaderboard: Array<{
      rank: number;
      displayName: string;
      score: number;
      correctAnswers: number;
    }>;
    stats: { totalParticipants: number; averageScore: number };
  };
}) {
  const winner = results.leaderboard[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-500 to-orange-600 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Winner */}
        <div className="text-center mb-8">
          <Crown className="h-16 w-16 mx-auto text-yellow-200 mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Partita Terminata!</h1>
          {winner && (
            <div className="bg-white rounded-2xl p-6 mt-6 shadow-xl">
              <p className="text-gray-600 text-sm">VINCITORE</p>
              <p className="text-3xl font-bold text-gray-900">{winner.displayName}</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{winner.score}</p>
                  <p className="text-sm text-gray-500">punti</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {winner.correctAnswers}/{results.session.totalQuestions}
                  </p>
                  <p className="text-sm text-gray-500">corrette</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full Leaderboard */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Classifica Finale
          </h2>
          <div className="space-y-2">
            {results.leaderboard.map((player, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0
                    ? 'bg-yellow-50 border-2 border-yellow-400'
                    : index === 1
                    ? 'bg-gray-100'
                    : index === 2
                    ? 'bg-orange-50'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0
                        ? 'bg-yellow-400 text-yellow-900'
                        : index === 1
                        ? 'bg-gray-400 text-white'
                        : index === 2
                        ? 'bg-orange-400 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {player.rank}
                  </span>
                  <span className="font-medium text-gray-900">{player.displayName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {player.correctAnswers} corrette
                  </span>
                  <span className="font-bold text-lg">{player.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
            <p className="text-white/80 text-sm">Partecipanti</p>
            <p className="text-white text-2xl font-bold">
              {results.stats.totalParticipants}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
            <p className="text-white/80 text-sm">Media Punteggio</p>
            <p className="text-white text-2xl font-bold">
              {Math.round(results.stats.averageScore)}
            </p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Torna alla Home
          </a>
        </div>
      </div>
    </div>
  );
}
