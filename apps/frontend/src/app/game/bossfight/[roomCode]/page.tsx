'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Sword,
  Shield,
  Heart,
  Zap,
  Users,
  Trophy,
  Star,
  Flame,
  Skull,
  Crown,
  Target,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

type BossState = {
  name: string;
  maxHealth: number;
  currentHealth: number;
  phase: number;
  totalPhases: number;
  isEnraged: boolean;
  attackPower: number;
  sprite: string;
};

type PlayerState = {
  id: string;
  name: string;
  damage: number;
  combos: number;
  isAlive: boolean;
  role: 'ATTACKER' | 'HEALER' | 'DEFENDER';
};

type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
};

type GameState = {
  status: 'WAITING' | 'FIGHTING' | 'VICTORY' | 'DEFEAT';
  boss: BossState;
  players: PlayerState[];
  teamHealth: number;
  maxTeamHealth: number;
  currentQuestion: Question | null;
  timeRemaining: number;
  comboMultiplier: number;
  totalDamage: number;
};

const BOSS_SPRITES = {
  dragon: '/bosses/dragon.png',
  golem: '/bosses/golem.png',
  wizard: '/bosses/wizard.png',
  kraken: '/bosses/kraken.png',
};

const ROLE_CONFIG = {
  ATTACKER: { icon: Sword, color: 'red', bonus: 'Danno +50%' },
  HEALER: { icon: Heart, color: 'green', bonus: 'Cura team' },
  DEFENDER: { icon: Shield, color: 'blue', bonus: 'Riduce danni' },
};

export default function BossFightPage() {
  const params = useParams();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'ATTACKER' | 'HEALER' | 'DEFENDER'>('ATTACKER');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; damage: number } | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    status: 'WAITING',
    boss: {
      name: 'Drago Ancestrale',
      maxHealth: 10000,
      currentHealth: 10000,
      phase: 1,
      totalPhases: 3,
      isEnraged: false,
      attackPower: 100,
      sprite: 'dragon',
    },
    players: [],
    teamHealth: 1000,
    maxTeamHealth: 1000,
    currentQuestion: null,
    timeRemaining: 0,
    comboMultiplier: 1,
    totalDamage: 0,
  });

  const bossRef = useRef<HTMLDivElement>(null);
  const [bossAnimation, setBossAnimation] = useState<'idle' | 'hit' | 'attack' | 'death'>('idle');

  // Socket connection
  useEffect(() => {
    if (!isJoined) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      query: { roomCode: params.roomCode, gameMode: 'bossfight' },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_bossfight', {
        roomCode: params.roomCode,
        playerName,
        role: selectedRole,
      });
    });

    newSocket.on('game_state_update', (state: Partial<GameState>) => {
      setGameState((prev) => ({ ...prev, ...state }));
    });

    newSocket.on('boss_hit', (data: { damage: number; newHealth: number }) => {
      setBossAnimation('hit');
      setTimeout(() => setBossAnimation('idle'), 500);
      setGameState((prev) => ({
        ...prev,
        boss: { ...prev.boss, currentHealth: data.newHealth },
        totalDamage: prev.totalDamage + data.damage,
      }));
    });

    newSocket.on('boss_attack', (data: { damage: number; teamHealth: number }) => {
      setBossAnimation('attack');
      setTimeout(() => setBossAnimation('idle'), 1000);
      setGameState((prev) => ({
        ...prev,
        teamHealth: data.teamHealth,
      }));
    });

    newSocket.on('phase_change', (phase: number) => {
      setGameState((prev) => ({
        ...prev,
        boss: {
          ...prev.boss,
          phase,
          isEnraged: phase === prev.boss.totalPhases,
        },
      }));
    });

    newSocket.on('question_result', (result: { correct: boolean; damage: number; combo: number }) => {
      setLastResult({ correct: result.correct, damage: result.damage });
      setShowFeedback(true);
      setGameState((prev) => ({
        ...prev,
        comboMultiplier: result.combo,
      }));
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedAnswer(null);
      }, 1500);
    });

    newSocket.on('victory', () => {
      setBossAnimation('death');
      setGameState((prev) => ({ ...prev, status: 'VICTORY' }));
    });

    newSocket.on('defeat', () => {
      setGameState((prev) => ({ ...prev, status: 'DEFEAT' }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isJoined, params.roomCode, playerName, selectedRole]);

  // Timer effect
  useEffect(() => {
    if (gameState.status !== 'FIGHTING' || gameState.timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        timeRemaining: Math.max(0, prev.timeRemaining - 1),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.status, gameState.timeRemaining]);

  const handleJoin = () => {
    if (playerName.trim()) {
      setIsJoined(true);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    socket?.emit('submit_answer', {
      roomCode: params.roomCode,
      answerIndex,
      responseTime: gameState.currentQuestion?.timeLimit
        ? gameState.currentQuestion.timeLimit - gameState.timeRemaining
        : 0,
    });
  };

  const bossHealthPercent = (gameState.boss.currentHealth / gameState.boss.maxHealth) * 100;
  const teamHealthPercent = (gameState.teamHealth / gameState.maxTeamHealth) * 100;
  const currentPlayer = gameState.players.find((p) => p.name === playerName);

  // Join Screen
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sword className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Boss Fight</h1>
            <p className="text-gray-400">Unisciti alla battaglia!</p>
            <p className="text-sm text-gray-500 mt-2">Stanza: {params.roomCode}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Il tuo nome</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Inserisci il tuo nome..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Scegli il tuo ruolo</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map((role) => {
                  const config = ROLE_CONFIG[role];
                  const Icon = config.icon;
                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedRole === role
                          ? `border-${config.color}-500 bg-${config.color}-500/20`
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <Icon
                        className={`h-8 w-8 mx-auto mb-2 ${
                          config.color === 'red'
                            ? 'text-red-400'
                            : config.color === 'green'
                            ? 'text-green-400'
                            : 'text-blue-400'
                        }`}
                      />
                      <p className="text-white font-medium text-sm">{role}</p>
                      <p className="text-xs text-gray-400 mt-1">{config.bonus}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={!playerName.trim()}
              className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sword className="h-5 w-5" />
              Entra in Battaglia
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for game to start
  if (gameState.status === 'WAITING') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Preparazione Battaglia</h2>
          <p className="text-gray-400 mb-6">In attesa che il docente avvii il gioco...</p>

          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Eroi in squadra</p>
            <div className="flex flex-wrap justify-center gap-2">
              {gameState.players.map((player) => {
                const roleConfig = ROLE_CONFIG[player.role];
                const Icon = roleConfig.icon;
                return (
                  <div
                    key={player.id}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                      roleConfig.color === 'red'
                        ? 'bg-red-600/20 text-red-400'
                        : roleConfig.color === 'green'
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-blue-600/20 text-blue-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-white">{player.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Users className="h-5 w-5" />
            <span>{gameState.players.length} eroi pronti</span>
          </div>
        </div>
      </div>
    );
  }

  // Victory Screen
  if (gameState.status === 'VICTORY') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-900 via-orange-900 to-red-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mb-8">
            <Crown className="h-24 w-24 text-yellow-400 mx-auto animate-bounce" />
            <div className="absolute -top-4 -right-4">
              <Star className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">VITTORIA!</h1>
          <p className="text-xl text-yellow-200 mb-8">
            Avete sconfitto {gameState.boss.name}!
          </p>

          <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-8 max-w-md mx-auto">
            <h3 className="text-white font-semibold mb-4">Statistiche Battaglia</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-gray-400">Danno Totale</p>
                <p className="text-2xl font-bold text-red-400">
                  {gameState.totalDamage.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-gray-400">Team HP Rimasti</p>
                <p className="text-2xl font-bold text-green-400">
                  {gameState.teamHealth}/{gameState.maxTeamHealth}
                </p>
              </div>
            </div>
          </div>

          {/* Top Damage Dealers */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 max-w-md mx-auto">
            <h3 className="text-white font-semibold mb-4">Top Eroi</h3>
            <div className="space-y-2">
              {gameState.players
                .sort((a, b) => b.damage - a.damage)
                .slice(0, 5)
                .map((player, idx) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 bg-white/10 rounded-lg p-2"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0
                          ? 'bg-yellow-500 text-yellow-900'
                          : idx === 1
                          ? 'bg-gray-400 text-gray-900'
                          : idx === 2
                          ? 'bg-amber-600 text-amber-100'
                          : 'bg-gray-600 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-white">{player.name}</span>
                    <span className="text-red-400 font-medium">
                      {player.damage.toLocaleString()} DMG
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Defeat Screen
  if (gameState.status === 'DEFEAT') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <Skull className="h-24 w-24 text-gray-500 mx-auto mb-8" />

          <h1 className="text-5xl font-bold text-red-500 mb-4">SCONFITTA</h1>
          <p className="text-xl text-gray-400 mb-8">
            {gameState.boss.name} ha vinto questa volta...
          </p>

          <div className="bg-white/5 rounded-xl p-6 mb-8 max-w-md mx-auto">
            <p className="text-gray-400 mb-2">Boss HP Rimasti</p>
            <p className="text-3xl font-bold text-red-400">
              {gameState.boss.currentHealth.toLocaleString()}/{gameState.boss.maxHealth.toLocaleString()}
            </p>
          </div>

          <p className="text-gray-500">Ritenterete la prossima volta!</p>
        </div>
      </div>
    );
  }

  // Battle Screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
      {/* Boss Area */}
      <div className="relative h-[45vh] flex items-center justify-center">
        {/* Boss Health Bar */}
        <div className="absolute top-4 left-4 right-4">
          <div className="flex items-center gap-3 mb-2">
            <Skull className="h-6 w-6 text-red-500" />
            <span className="text-white font-bold text-lg">{gameState.boss.name}</span>
            {gameState.boss.isEnraged && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full animate-pulse">
                ENRAGED!
              </span>
            )}
            <span className="ml-auto text-gray-400 text-sm">
              Fase {gameState.boss.phase}/{gameState.boss.totalPhases}
            </span>
          </div>
          <div className="h-6 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                gameState.boss.isEnraged
                  ? 'bg-gradient-to-r from-red-600 to-orange-500'
                  : 'bg-gradient-to-r from-red-700 to-red-500'
              }`}
              style={{ width: `${bossHealthPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>{gameState.boss.currentHealth.toLocaleString()} HP</span>
            <span>{gameState.boss.maxHealth.toLocaleString()} HP</span>
          </div>
        </div>

        {/* Boss Sprite */}
        <div
          ref={bossRef}
          className={`relative transition-all duration-300 ${
            bossAnimation === 'hit'
              ? 'animate-pulse scale-95 brightness-150'
              : bossAnimation === 'attack'
              ? 'animate-bounce'
              : bossAnimation === 'death'
              ? 'opacity-0 scale-0'
              : ''
          }`}
        >
          <div className="w-48 h-48 bg-gradient-to-br from-red-600 to-purple-700 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50">
            <Flame className="h-24 w-24 text-orange-400" />
          </div>

          {/* Damage numbers */}
          {showFeedback && lastResult && (
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-4xl font-bold animate-bounce ${
                lastResult.correct ? 'text-yellow-400' : 'text-gray-500'
              }`}
            >
              {lastResult.correct ? `-${lastResult.damage}` : 'MISS!'}
            </div>
          )}
        </div>
      </div>

      {/* Team Status Bar */}
      <div className="bg-gray-800/80 backdrop-blur px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-500" />
            <span className="text-white text-sm">Team HP</span>
          </div>
          <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                teamHealthPercent > 50
                  ? 'bg-green-500'
                  : teamHealthPercent > 25
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${teamHealthPercent}%` }}
            />
          </div>
          <span className="text-white text-sm font-medium">
            {gameState.teamHealth}/{gameState.maxTeamHealth}
          </span>

          {/* Combo Multiplier */}
          {gameState.comboMultiplier > 1 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-orange-500 rounded-full">
              <Zap className="h-4 w-4 text-white" />
              <span className="text-white font-bold">x{gameState.comboMultiplier}</span>
            </div>
          )}
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 p-4">
        {gameState.currentQuestion ? (
          <div className="max-w-2xl mx-auto">
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                  gameState.timeRemaining <= 5
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {gameState.timeRemaining}
              </div>
            </div>

            {/* Question */}
            <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    gameState.currentQuestion.difficulty === 'EASY'
                      ? 'bg-green-600 text-white'
                      : gameState.currentQuestion.difficulty === 'MEDIUM'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {gameState.currentQuestion.difficulty}
                </span>
              </div>
              <p className="text-white text-xl">{gameState.currentQuestion.text}</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {gameState.currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const colors = [
                  'from-red-600 to-red-700 hover:from-red-500 hover:to-red-600',
                  'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600',
                  'from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600',
                  'from-green-600 to-green-700 hover:from-green-500 hover:to-green-600',
                ];

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedAnswer !== null}
                    className={`p-4 rounded-xl font-semibold text-white transition-all ${
                      isSelected
                        ? 'ring-4 ring-white scale-95'
                        : selectedAnswer !== null
                        ? 'opacity-50'
                        : ''
                    } bg-gradient-to-br ${colors[idx]} disabled:cursor-not-allowed`}
                  >
                    <span className="text-lg">{String.fromCharCode(65 + idx)}.</span>{' '}
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-400">Preparando prossimo attacco...</p>
            </div>
          </div>
        )}
      </div>

      {/* Player Stats */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur border-t border-gray-700 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentPlayer && (
              <>
                {(() => {
                  const roleConfig = ROLE_CONFIG[currentPlayer.role];
                  const Icon = roleConfig.icon;
                  return (
                    <div
                      className={`p-2 rounded-lg ${
                        roleConfig.color === 'red'
                          ? 'bg-red-600/20'
                          : roleConfig.color === 'green'
                          ? 'bg-green-600/20'
                          : 'bg-blue-600/20'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          roleConfig.color === 'red'
                            ? 'text-red-400'
                            : roleConfig.color === 'green'
                            ? 'text-green-400'
                            : 'text-blue-400'
                        }`}
                      />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-white font-medium">{currentPlayer.name}</p>
                  <p className="text-sm text-gray-400">
                    {currentPlayer.damage.toLocaleString()} danno totale
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs">Combo</p>
              <p className="text-white font-bold">{currentPlayer?.combos || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Team</p>
              <p className="text-white font-bold">{gameState.players.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Overlay */}
      {showFeedback && lastResult && (
        <div
          className={`fixed inset-0 pointer-events-none flex items-center justify-center ${
            lastResult.correct ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}
        >
          <div
            className={`text-6xl font-bold ${
              lastResult.correct ? 'text-green-400' : 'text-red-400'
            } animate-pulse`}
          >
            {lastResult.correct ? 'COLPITO!' : 'MANCATO!'}
          </div>
        </div>
      )}
    </div>
  );
}
