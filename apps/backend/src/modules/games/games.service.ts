import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { AIClientService } from '../content/ai-client.service';
import { CreateGameDto } from './dto/game.dto';
import { GameType, GameStatus, XPSource, QuizType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  timeLimit: number;
  points: number;
}

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly aiClient: AIClientService,
  ) {}

  async createSession(hostId: string, createDto: CreateGameDto) {
    const roomCode = this.generateRoomCode();

    // Generate questions if content is provided
    let questions: GameQuestion[] = [];
    if (createDto.contentId) {
      const content = await this.prisma.content.findUnique({
        where: { id: createDto.contentId },
      });

      if (content) {
        const generatedQuestions = await this.aiClient.generateQuiz(
          content.rawContent || '',
          QuizType.MULTIPLE_CHOICE,
          createDto.numQuestions || 10,
        );

        questions = generatedQuestions.map((q, index) => ({
          id: q.id,
          question: q.question,
          options: q.options || [],
          correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer,
          timeLimit: createDto.timePerQuestion || 20,
          points: this.calculatePoints(index, createDto.gameType),
        }));
      }
    }

    const session = await this.prisma.gameSession.create({
      data: {
        gameType: createDto.gameType,
        classroomId: createDto.classroomId,
        hostId,
        contentId: createDto.contentId,
        roomCode,
        status: GameStatus.WAITING,
        settings: {
          numQuestions: createDto.numQuestions || 10,
          timePerQuestion: createDto.timePerQuestion || 20,
          showLeaderboard: createDto.showLeaderboard ?? true,
          allowLateJoin: createDto.allowLateJoin ?? false,
          dsaExtraTime: createDto.dsaExtraTime ?? 50,
        },
        questions,
      },
    });

    // Store session in Redis for fast access
    await this.redis.set(
      `game:${roomCode}`,
      JSON.stringify({
        id: session.id,
        status: session.status,
        currentQuestion: 0,
        participants: [],
      }),
      3600 * 2, // 2 hours TTL
    );

    return session;
  }

  async findByClassroom(classroomId: string) {
    return this.prisma.gameSession.findMany({
      where: { classroomId },
      include: {
        host: { select: { firstName: true, lastName: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id },
      include: {
        host: { select: { firstName: true, lastName: true } },
        classroom: { select: { name: true } },
        participants: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Game session not found');
    }

    return session;
  }

  async findByRoomCode(code: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { roomCode: code },
      include: {
        host: { select: { firstName: true, lastName: true } },
        classroom: { select: { name: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Game session not found');
    }

    return session;
  }

  async joinSession(sessionId: string, userId: string, nickname?: string) {
    const existing = await this.prisma.gameParticipant.findUnique({
      where: {
        gameSessionId_userId: { gameSessionId: sessionId, userId },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.gameParticipant.create({
      data: {
        gameSessionId: sessionId,
        userId,
        nickname,
      },
    });
  }

  async leaveSession(sessionId: string, userId: string) {
    return this.prisma.gameParticipant.update({
      where: {
        gameSessionId_userId: { gameSessionId: sessionId, userId },
      },
      data: { leftAt: new Date() },
    });
  }

  async updateStatus(sessionId: string, status: GameStatus) {
    const session = await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status,
        ...(status === GameStatus.IN_PROGRESS && { startedAt: new Date() }),
        ...(status === GameStatus.FINISHED && { endedAt: new Date() }),
      },
    });

    // Update Redis cache
    const cached = await this.redis.get(`game:${session.roomCode}`);
    if (cached) {
      const data = JSON.parse(cached);
      data.status = status;
      await this.redis.set(`game:${session.roomCode}`, JSON.stringify(data), 3600 * 2);
    }

    return session;
  }

  async submitAnswer(
    sessionId: string,
    participantId: string,
    questionId: string,
    answer: string,
    timeSpent: number,
  ) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Game session not found');
    }

    const questions = session.questions as GameQuestion[];
    const question = questions.find((q) => q.id === questionId);

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const isCorrect = answer === question.correctAnswer;
    const points = isCorrect
      ? this.calculateScore(question.points, timeSpent, question.timeLimit)
      : 0;

    // Update participant score
    await this.prisma.gameParticipant.update({
      where: { id: participantId },
      data: {
        score: { increment: points },
        correctAnswers: { increment: isCorrect ? 1 : 0 },
        wrongAnswers: { increment: isCorrect ? 0 : 1 },
      },
    });

    return { isCorrect, points, correctAnswer: question.correctAnswer };
  }

  async getLeaderboard(sessionId: string) {
    const participants = await this.prisma.gameParticipant.findMany({
      where: { gameSessionId: sessionId },
      include: {
        user: {
          select: { firstName: true, lastName: true, studentProfile: true },
        },
      },
      orderBy: { score: 'desc' },
    });

    return participants.map((p, index) => ({
      rank: index + 1,
      participantId: p.id,
      nickname: p.nickname || `${p.user.firstName} ${p.user.lastName}`,
      score: p.score,
      correctAnswers: p.correctAnswers,
      wrongAnswers: p.wrongAnswers,
    }));
  }

  async getResults(sessionId: string) {
    const session = await this.findById(sessionId);
    const leaderboard = await this.getLeaderboard(sessionId);

    return {
      session: {
        id: session.id,
        gameType: session.gameType,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        totalQuestions: (session.questions as GameQuestion[]).length,
      },
      leaderboard,
      stats: {
        totalParticipants: leaderboard.length,
        averageScore:
          leaderboard.reduce((sum, p) => sum + p.score, 0) / leaderboard.length || 0,
        averageCorrect:
          leaderboard.reduce((sum, p) => sum + p.correctAnswers, 0) / leaderboard.length || 0,
      },
    };
  }

  async awardXP(sessionId: string) {
    const leaderboard = await this.getLeaderboard(sessionId);

    for (const participant of leaderboard) {
      const baseXP = 5; // Participation XP
      const winnerBonus = participant.rank === 1 ? 20 : participant.rank <= 3 ? 10 : 0;
      const correctBonus = participant.correctAnswers * 2;

      const totalXP = baseXP + winnerBonus + correctBonus;

      const participantData = await this.prisma.gameParticipant.findUnique({
        where: { id: participant.participantId },
      });

      if (participantData) {
        await this.prisma.xPReward.create({
          data: {
            userId: participantData.userId,
            amount: totalXP,
            source: participant.rank === 1 ? XPSource.GAME_WIN : XPSource.GAME_PARTICIPATION,
            sourceId: sessionId,
          },
        });
      }
    }
  }

  getGameTypes() {
    return [
      {
        type: GameType.RAPID_QUIZ,
        name: 'Rapid Quiz',
        description: 'Quiz veloce con domande a tempo',
        icon: 'lightning',
        minPlayers: 1,
        maxPlayers: 50,
      },
      {
        type: GameType.WORD_RUSH,
        name: 'Word Rush',
        description: 'Indovina la parola dai suggerimenti',
        icon: 'text',
        minPlayers: 2,
        maxPlayers: 30,
      },
      {
        type: GameType.SQUAD_PUZZLE,
        name: 'Squad Puzzle',
        description: 'Risolvi puzzle in squadra',
        icon: 'puzzle',
        minPlayers: 4,
        maxPlayers: 40,
      },
      {
        type: GameType.BOSS_FIGHT,
        name: 'Boss Fight',
        description: 'Sconfiggi il boss rispondendo alle domande',
        icon: 'sword',
        minPlayers: 1,
        maxPlayers: 30,
      },
      {
        type: GameType.DUNGEON,
        name: 'Dungeon',
        description: 'Esplora il dungeon con livelli di difficoltà crescente',
        icon: 'dungeon',
        minPlayers: 1,
        maxPlayers: 20,
      },
      {
        type: GameType.TOURNAMENT,
        name: 'Tournament',
        description: 'Torneo eliminazione diretta',
        icon: 'trophy',
        minPlayers: 4,
        maxPlayers: 64,
      },
    ];
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private calculatePoints(questionIndex: number, gameType: GameType): number {
    switch (gameType) {
      case GameType.BOSS_FIGHT:
        return 100 + questionIndex * 10; // Increasing points
      case GameType.DUNGEON:
        return Math.floor(100 * Math.pow(1.1, questionIndex)); // Exponential
      default:
        return 100; // Fixed points
    }
  }

  private calculateScore(
    basePoints: number,
    timeSpent: number,
    timeLimit: number,
  ): number {
    const timeBonus = Math.max(0, 1 - timeSpent / timeLimit);
    return Math.round(basePoints * (0.5 + 0.5 * timeBonus));
  }
}
