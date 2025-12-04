'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Map,
  Key,
  Gem,
  Scroll,
  Shield,
  Sword,
  Heart,
  Star,
  Lock,
  Unlock,
  DoorOpen,
  Flame,
  Snowflake,
  Zap,
  Eye,
  Skull,
  Crown,
  ChevronRight,
  Trophy,
  Loader2,
  Package,
  Coins,
} from 'lucide-react';

type RoomType = 'START' | 'MONSTER' | 'TREASURE' | 'PUZZLE' | 'TRAP' | 'BOSS' | 'EXIT';

type DungeonRoom = {
  id: string;
  type: RoomType;
  name: string;
  description: string;
  isCleared: boolean;
  isLocked: boolean;
  requiredKeys: number;
  rewards: {
    xp: number;
    gold: number;
    items?: string[];
  };
  connections: string[];
};

type PlayerInventory = {
  keys: number;
  gold: number;
  items: string[];
  potions: number;
};

type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
};

type GameState = {
  status: 'EXPLORING' | 'ENCOUNTER' | 'VICTORY' | 'DEFEAT';
  currentRoom: DungeonRoom | null;
  visitedRooms: string[];
  dungeonMap: DungeonRoom[];
  playerHealth: number;
  maxHealth: number;
  playerXP: number;
  inventory: PlayerInventory;
  currentQuestion: Question | null;
  encounterType: 'MONSTER' | 'TREASURE' | 'PUZZLE' | 'TRAP' | null;
  timeRemaining: number;
};

const ROOM_ICONS = {
  START: DoorOpen,
  MONSTER: Skull,
  TREASURE: Gem,
  PUZZLE: Scroll,
  TRAP: Flame,
  BOSS: Crown,
  EXIT: Trophy,
};

const ROOM_COLORS = {
  START: 'bg-blue-600',
  MONSTER: 'bg-red-600',
  TREASURE: 'bg-yellow-600',
  PUZZLE: 'bg-purple-600',
  TRAP: 'bg-orange-600',
  BOSS: 'bg-pink-600',
  EXIT: 'bg-green-600',
};

export default function DungeonRaidPage() {
  const params = useParams();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [showMap, setShowMap] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    status: 'EXPLORING',
    currentRoom: null,
    visitedRooms: [],
    dungeonMap: [],
    playerHealth: 100,
    maxHealth: 100,
    playerXP: 0,
    inventory: {
      keys: 0,
      gold: 0,
      items: [],
      potions: 2,
    },
    currentQuestion: null,
    encounterType: null,
    timeRemaining: 0,
  });

  // Socket connection
  useEffect(() => {
    if (!isJoined) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      query: { roomCode: params.roomCode, gameMode: 'dungeon' },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_dungeon', {
        roomCode: params.roomCode,
        playerName,
      });
    });

    newSocket.on('game_state_update', (state: Partial<GameState>) => {
      setGameState((prev) => ({ ...prev, ...state }));
    });

    newSocket.on('room_entered', (room: DungeonRoom) => {
      setGameState((prev) => ({
        ...prev,
        currentRoom: room,
        visitedRooms: [...prev.visitedRooms, room.id],
      }));
    });

    newSocket.on('encounter_start', (data: { type: typeof gameState.encounterType; question: Question }) => {
      setGameState((prev) => ({
        ...prev,
        status: 'ENCOUNTER',
        encounterType: data.type,
        currentQuestion: data.question,
        timeRemaining: 30,
      }));
      setSelectedAnswer(null);
      setShowResult(false);
    });

    newSocket.on('encounter_result', (result: {
      correct: boolean;
      message: string;
      rewards?: { xp: number; gold: number; items?: string[] };
      damage?: number;
    }) => {
      setLastResult({ correct: result.correct, message: result.message });
      setShowResult(true);

      if (result.correct && result.rewards) {
        setGameState((prev) => ({
          ...prev,
          playerXP: prev.playerXP + result.rewards!.xp,
          inventory: {
            ...prev.inventory,
            gold: prev.inventory.gold + result.rewards!.gold,
            items: [...prev.inventory.items, ...(result.rewards!.items || [])],
          },
        }));
      } else if (result.damage) {
        setGameState((prev) => ({
          ...prev,
          playerHealth: Math.max(0, prev.playerHealth - result.damage!),
        }));
      }

      setTimeout(() => {
        setShowResult(false);
        setGameState((prev) => ({
          ...prev,
          status: 'EXPLORING',
          encounterType: null,
          currentQuestion: null,
          currentRoom: prev.currentRoom
            ? { ...prev.currentRoom, isCleared: true }
            : null,
        }));
      }, 2000);
    });

    newSocket.on('key_found', () => {
      setGameState((prev) => ({
        ...prev,
        inventory: { ...prev.inventory, keys: prev.inventory.keys + 1 },
      }));
    });

    newSocket.on('dungeon_complete', () => {
      setGameState((prev) => ({ ...prev, status: 'VICTORY' }));
    });

    newSocket.on('player_defeated', () => {
      setGameState((prev) => ({ ...prev, status: 'DEFEAT' }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isJoined, params.roomCode, playerName]);

  // Timer effect
  useEffect(() => {
    if (gameState.status !== 'ENCOUNTER' || gameState.timeRemaining <= 0) return;

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
    });
  };

  const handleMoveToRoom = (roomId: string) => {
    const room = gameState.dungeonMap.find((r) => r.id === roomId);
    if (!room) return;

    if (room.isLocked && gameState.inventory.keys < room.requiredKeys) {
      // Not enough keys
      return;
    }

    socket?.emit('move_to_room', {
      roomCode: params.roomCode,
      roomId,
    });
  };

  const handleUsePotion = () => {
    if (gameState.inventory.potions <= 0) return;
    socket?.emit('use_potion', { roomCode: params.roomCode });
    setGameState((prev) => ({
      ...prev,
      playerHealth: Math.min(prev.maxHealth, prev.playerHealth + 30),
      inventory: { ...prev.inventory, potions: prev.inventory.potions - 1 },
    }));
  };

  const healthPercent = (gameState.playerHealth / gameState.maxHealth) * 100;

  // Join Screen
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-stone-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-stone-800/80 backdrop-blur rounded-2xl p-8 max-w-md w-full border border-stone-600">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
              <Map className="h-10 w-10 text-amber-100" />
            </div>
            <h1 className="text-3xl font-bold text-amber-100 mb-2">Dungeon Raid</h1>
            <p className="text-stone-400">Esplora il dungeon e conquista il tesoro!</p>
            <p className="text-sm text-stone-500 mt-2">Stanza: {params.roomCode}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-stone-400 mb-2">Nome avventuriero</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Inserisci il tuo nome..."
                className="w-full px-4 py-3 bg-stone-700 text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none border border-stone-600"
                maxLength={20}
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!playerName.trim()}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-xl font-bold text-lg hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <DoorOpen className="h-5 w-5" />
              Entra nel Dungeon
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Victory Screen
  if (gameState.status === 'VICTORY') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 via-yellow-900 to-stone-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Trophy className="h-24 w-24 text-yellow-400 mx-auto mb-8 animate-bounce" />
          <h1 className="text-5xl font-bold text-white mb-4">DUNGEON CONQUISTATO!</h1>
          <p className="text-xl text-amber-200 mb-8">
            Hai completato l'esplorazione con successo!
          </p>

          <div className="bg-white/10 backdrop-blur rounded-xl p-6 max-w-md mx-auto">
            <h3 className="text-white font-semibold mb-4">Bottino Totale</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <Star className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{gameState.playerXP}</p>
                <p className="text-xs text-gray-400">XP</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <Coins className="h-6 w-6 text-yellow-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{gameState.inventory.gold}</p>
                <p className="text-xs text-gray-400">Oro</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <Package className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{gameState.inventory.items.length}</p>
                <p className="text-xs text-gray-400">Oggetti</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Defeat Screen
  if (gameState.status === 'DEFEAT') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-950 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <Skull className="h-24 w-24 text-red-500 mx-auto mb-8" />
          <h1 className="text-5xl font-bold text-red-500 mb-4">SCONFITTO</h1>
          <p className="text-xl text-gray-400 mb-8">
            Il dungeon ha avuto la meglio su di te...
          </p>
          <p className="text-gray-500">
            Hai raccolto {gameState.playerXP} XP e {gameState.inventory.gold} oro prima della sconfitta.
          </p>
        </div>
      </div>
    );
  }

  // Encounter Screen
  if (gameState.status === 'ENCOUNTER' && gameState.currentQuestion) {
    const encounterConfig = {
      MONSTER: { title: 'Combattimento!', icon: Sword, color: 'red' },
      TREASURE: { title: 'Enigma del Tesoro', icon: Gem, color: 'yellow' },
      PUZZLE: { title: 'Puzzle Antico', icon: Scroll, color: 'purple' },
      TRAP: { title: 'Trappola!', icon: Flame, color: 'orange' },
    };

    const config = encounterConfig[gameState.encounterType!];
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-stone-900 to-gray-900 p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              config.color === 'red'
                ? 'bg-red-600'
                : config.color === 'yellow'
                ? 'bg-yellow-600'
                : config.color === 'purple'
                ? 'bg-purple-600'
                : 'bg-orange-600'
            }`}
          >
            <Icon className="h-5 w-5 text-white" />
            <span className="text-white font-semibold">{config.title}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${
              gameState.timeRemaining <= 5
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-stone-700 text-white'
            }`}
          >
            {gameState.timeRemaining}
          </div>
        </div>

        {/* Question */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-stone-800/80 backdrop-blur rounded-xl p-6 mb-6 border border-stone-600">
            <p className="text-white text-xl text-center">
              {gameState.currentQuestion.text}
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            {gameState.currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
                className={`p-4 rounded-xl font-semibold text-white transition-all border-2 ${
                  selectedAnswer === idx
                    ? 'border-amber-400 bg-amber-600'
                    : 'border-stone-600 bg-stone-700 hover:border-stone-500'
                } disabled:cursor-not-allowed`}
              >
                <span className="text-amber-300 mr-2">{String.fromCharCode(65 + idx)}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Result Overlay */}
        {showResult && lastResult && (
          <div
            className={`fixed inset-0 flex items-center justify-center ${
              lastResult.correct ? 'bg-green-500/30' : 'bg-red-500/30'
            }`}
          >
            <div className="bg-stone-800 rounded-2xl p-8 text-center">
              {lastResult.correct ? (
                <Star className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              ) : (
                <Skull className="h-16 w-16 text-red-500 mx-auto mb-4" />
              )}
              <p className="text-2xl font-bold text-white mb-2">
                {lastResult.correct ? 'Successo!' : 'Fallito!'}
              </p>
              <p className="text-gray-400">{lastResult.message}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Exploration Screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-stone-900 to-gray-900">
      {/* Top Bar */}
      <div className="bg-stone-800/90 backdrop-blur border-b border-stone-700 p-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Health */}
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-red-500" />
            <div className="w-32 h-3 bg-stone-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  healthPercent > 50
                    ? 'bg-green-500'
                    : healthPercent > 25
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${healthPercent}%` }}
              />
            </div>
            <span className="text-white text-sm">
              {gameState.playerHealth}/{gameState.maxHealth}
            </span>
          </div>

          {/* Inventory Quick View */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-yellow-400">
              <Key className="h-4 w-4" />
              <span className="font-medium">{gameState.inventory.keys}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Coins className="h-4 w-4" />
              <span className="font-medium">{gameState.inventory.gold}</span>
            </div>
            <div className="flex items-center gap-1 text-purple-400">
              <Star className="h-4 w-4" />
              <span className="font-medium">{gameState.playerXP} XP</span>
            </div>
            <button
              onClick={() => setShowMap(!showMap)}
              className="p-2 bg-stone-700 rounded-lg hover:bg-stone-600"
            >
              <Map className="h-5 w-5 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Current Room */}
        {gameState.currentRoom && (
          <div className="bg-stone-800/80 backdrop-blur rounded-2xl p-6 border border-stone-600 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`p-4 rounded-xl ${ROOM_COLORS[gameState.currentRoom.type]}`}
              >
                {(() => {
                  const Icon = ROOM_ICONS[gameState.currentRoom.type];
                  return <Icon className="h-8 w-8 text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white">
                    {gameState.currentRoom.name}
                  </h2>
                  {gameState.currentRoom.isCleared && (
                    <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                      Completata
                    </span>
                  )}
                </div>
                <p className="text-stone-400">{gameState.currentRoom.description}</p>
              </div>
            </div>

            {/* Room Actions */}
            {!gameState.currentRoom.isCleared && gameState.currentRoom.type !== 'START' && (
              <button
                onClick={() => socket?.emit('interact_room', { roomCode: params.roomCode })}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-yellow-500 flex items-center justify-center gap-2"
              >
                <Sword className="h-5 w-5" />
                {gameState.currentRoom.type === 'MONSTER'
                  ? 'Affronta il mostro'
                  : gameState.currentRoom.type === 'TREASURE'
                  ? 'Apri il forziere'
                  : gameState.currentRoom.type === 'PUZZLE'
                  ? 'Risolvi il puzzle'
                  : gameState.currentRoom.type === 'TRAP'
                  ? 'Disinnesca la trappola'
                  : gameState.currentRoom.type === 'BOSS'
                  ? 'Sfida il Boss'
                  : 'Esplora'}
              </button>
            )}

            {/* Available Exits */}
            {gameState.currentRoom.connections.length > 0 && (
              <div className="mt-6">
                <h3 className="text-stone-400 text-sm mb-3">Stanze Collegate</h3>
                <div className="grid grid-cols-2 gap-3">
                  {gameState.currentRoom.connections.map((roomId) => {
                    const room = gameState.dungeonMap.find((r) => r.id === roomId);
                    if (!room) return null;

                    const isLocked = room.isLocked && gameState.inventory.keys < room.requiredKeys;
                    const Icon = ROOM_ICONS[room.type];

                    return (
                      <button
                        key={roomId}
                        onClick={() => handleMoveToRoom(roomId)}
                        disabled={isLocked}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isLocked
                            ? 'border-red-600/50 bg-red-900/20 cursor-not-allowed'
                            : 'border-stone-600 bg-stone-700/50 hover:border-amber-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${ROOM_COLORS[room.type]}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{room.name}</p>
                            <p className="text-xs text-stone-400">
                              {room.isCleared ? 'Completata' : room.type}
                            </p>
                          </div>
                          {isLocked ? (
                            <div className="flex items-center gap-1 text-red-400">
                              <Lock className="h-4 w-4" />
                              <span className="text-xs">{room.requiredKeys}</span>
                            </div>
                          ) : (
                            <ChevronRight className="h-5 w-5 text-stone-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleUsePotion}
            disabled={gameState.inventory.potions <= 0}
            className="px-6 py-3 bg-red-600/20 border border-red-600 text-red-400 rounded-xl font-medium hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Heart className="h-5 w-5" />
            Pozione ({gameState.inventory.potions})
          </button>
        </div>
      </div>

      {/* Dungeon Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Mappa del Dungeon</h2>
              <button
                onClick={() => setShowMap(false)}
                className="p-2 hover:bg-stone-700 rounded-lg text-gray-400"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {gameState.dungeonMap.map((room) => {
                const Icon = ROOM_ICONS[room.type];
                const isVisited = gameState.visitedRooms.includes(room.id);
                const isCurrent = gameState.currentRoom?.id === room.id;

                return (
                  <div
                    key={room.id}
                    className={`p-4 rounded-xl border ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-600/20'
                        : isVisited
                        ? 'border-stone-600 bg-stone-700'
                        : 'border-stone-700 bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`p-2 rounded ${
                          isVisited ? ROOM_COLORS[room.type] : 'bg-stone-600'
                        }`}
                      >
                        {isVisited ? (
                          <Icon className="h-4 w-4 text-white" />
                        ) : (
                          <Eye className="h-4 w-4 text-stone-400" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isVisited ? 'text-white' : 'text-stone-500'
                        }`}
                      >
                        {isVisited ? room.name : '???'}
                      </span>
                    </div>
                    {isVisited && room.isCleared && (
                      <span className="text-xs text-green-400">✓ Completata</span>
                    )}
                    {room.isLocked && !room.isCleared && (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Richiede {room.requiredKeys} chiavi
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-stone-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Posizione attuale</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-stone-600" />
                <span>Visitata</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-stone-800 border border-stone-700" />
                <span>Sconosciuta</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
