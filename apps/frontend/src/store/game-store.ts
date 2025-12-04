import { create } from 'zustand';

interface Player {
  id: string;
  displayName: string;
  score: number;
  isDsa: boolean;
}

interface Question {
  questionId: string;
  questionText: string;
  options: string[];
  timeLimit: number;
  points: number;
  questionNumber: number;
  totalQuestions: number;
}

interface GameState {
  // Room state
  roomCode: string | null;
  isHost: boolean;
  participantId: string | null;

  // Game state
  status: 'idle' | 'waiting' | 'starting' | 'playing' | 'finished';
  players: Player[];
  currentQuestion: Question | null;

  // Player state
  extraTimePercent: number;
  lastAnswer: {
    isCorrect: boolean;
    points: number;
    correctAnswer: string;
  } | null;

  // Leaderboard
  leaderboard: Array<{
    rank: number;
    displayName: string;
    score: number;
  }>;

  // Results
  results: {
    session: {
      gameType: string;
      totalQuestions: number;
    };
    leaderboard: Array<{
      rank: number;
      displayName: string;
      score: number;
      correctAnswers: number;
    }>;
    stats: {
      totalParticipants: number;
      averageScore: number;
      averageCorrect: number;
    };
  } | null;

  // Actions
  setRoomCode: (code: string | null) => void;
  setIsHost: (isHost: boolean) => void;
  setParticipantId: (id: string | null) => void;
  setStatus: (status: GameState['status']) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (displayName: string) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setExtraTimePercent: (percent: number) => void;
  setLastAnswer: (answer: GameState['lastAnswer']) => void;
  updateLeaderboard: (leaderboard: GameState['leaderboard']) => void;
  setResults: (results: GameState['results']) => void;
  reset: () => void;
}

const initialState = {
  roomCode: null,
  isHost: false,
  participantId: null,
  status: 'idle' as const,
  players: [],
  currentQuestion: null,
  extraTimePercent: 0,
  lastAnswer: null,
  leaderboard: [],
  results: null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setRoomCode: (code) => set({ roomCode: code }),
  setIsHost: (isHost) => set({ isHost }),
  setParticipantId: (id) => set({ participantId: id }),
  setStatus: (status) => set({ status }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players.filter((p) => p.id !== player.id), player],
    })),

  removePlayer: (displayName) =>
    set((state) => ({
      players: state.players.filter((p) => p.displayName !== displayName),
    })),

  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setExtraTimePercent: (percent) => set({ extraTimePercent: percent }),
  setLastAnswer: (answer) => set({ lastAnswer: answer }),
  updateLeaderboard: (leaderboard) => set({ leaderboard }),
  setResults: (results) => set({ results }),

  reset: () => set(initialState),
}));
