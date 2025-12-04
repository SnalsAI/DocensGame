import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GamesService } from './games.service';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GameStatus } from '@prisma/client';

interface JoinRoomPayload {
  roomCode: string;
  userId: string;
  nickname?: string;
}

interface AnswerPayload {
  roomCode: string;
  participantId: string;
  questionId: string;
  answer: string;
  timeSpent: number;
}

interface GameState {
  id: string;
  status: GameStatus;
  currentQuestion: number;
  participants: Array<{
    id: string;
    odisplayname: string;
    score: number;
  }>;
}

@WebSocketGateway({
  namespace: '/games',
  cors: {
    origin: '*',
  },
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, { socketId: string; roomCode: string }> = new Map();

  constructor(
    private readonly gamesService: GamesService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Find and remove user from room
    for (const [odisplayname, data] of this.connectedUsers) {
      if (data.socketId === client.id) {
        this.server.to(data.roomCode).emit('player_left', { odisplayname });
        this.connectedUsers.delete(odisplayname);
        break;
      }
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    try {
      const session = await this.gamesService.findByRoomCode(payload.roomCode);

      if (!session) {
        client.emit('error', { message: 'Room not found' });
        return;
      }

      if (session.status !== GameStatus.WAITING) {
        const settings = session.settings as { allowLateJoin?: boolean };
        if (!settings?.allowLateJoin) {
          client.emit('error', { message: 'Game already started' });
          return;
        }
      }

      // Get user info and DSA settings
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        include: { studentProfile: true },
      });

      const participant = await this.gamesService.joinSession(
        session.id,
        payload.userId,
        payload.nickname,
      );

      // Join socket room
      client.join(payload.roomCode);
      this.connectedUsers.set(payload.userId, {
        socketId: client.id,
        roomCode: payload.roomCode,
      });

      // Calculate extra time for DSA students
      const settings = session.settings as { dsaExtraTime?: number };
      const extraTimePercent =
        user?.studentProfile?.isDsa ? (settings?.dsaExtraTime || 50) : 0;

      // Notify room
      const displayName = payload.nickname || `${user?.firstName} ${user?.lastName}`;
      this.server.to(payload.roomCode).emit('player_joined', {
        odisplayname: displayName,
        odisplayname: displayName,
        odisplayname: displayName,
        odisplayname: displayName,
        odisplayname: displayName,
        odisplayname: displayName,
        odisplayname: displayName,
        participantId: participant.id,
        isDsa: user?.studentProfile?.isDsa || false,
      });

      // Send current game state to joining player
      const gameState = await this.getGameState(payload.roomCode);
      client.emit('game_state', {
        ...gameState,
        extraTimePercent,
      });

      return { success: true, participantId: participant.id };
    } catch (error) {
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; userId: string },
  ) {
    client.leave(payload.roomCode);
    this.connectedUsers.delete(payload.userId);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    this.server.to(payload.roomCode).emit('player_left', {
      displayName: `${user?.firstName} ${user?.lastName}`,
    });
  }

  @SubscribeMessage('start_game')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; hostId: string },
  ) {
    try {
      const session = await this.gamesService.findByRoomCode(payload.roomCode);

      if (session.hostId !== payload.hostId) {
        client.emit('error', { message: 'Only host can start the game' });
        return;
      }

      await this.gamesService.updateStatus(session.id, GameStatus.IN_PROGRESS);

      // Get first question
      const questions = session.questions as Array<{
        id: string;
        question: string;
        options: string[];
        timeLimit: number;
        points: number;
      }>;

      if (questions.length === 0) {
        client.emit('error', { message: 'No questions available' });
        return;
      }

      // Update Redis state
      await this.updateGameState(payload.roomCode, {
        status: GameStatus.IN_PROGRESS,
        currentQuestion: 0,
      });

      // Broadcast game start
      this.server.to(payload.roomCode).emit('game_started', {
        totalQuestions: questions.length,
      });

      // Send first question after countdown
      setTimeout(() => {
        this.sendQuestion(payload.roomCode, questions[0], 0, questions.length);
      }, 3000);
    } catch (error) {
      client.emit('error', { message: 'Failed to start game' });
    }
  }

  @SubscribeMessage('submit_answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AnswerPayload,
  ) {
    try {
      const session = await this.gamesService.findByRoomCode(payload.roomCode);

      const result = await this.gamesService.submitAnswer(
        session.id,
        payload.participantId,
        payload.questionId,
        payload.answer,
        payload.timeSpent,
      );

      // Send result to player
      client.emit('answer_result', result);

      // Update leaderboard for all
      const leaderboard = await this.gamesService.getLeaderboard(session.id);
      this.server.to(payload.roomCode).emit('leaderboard_update', leaderboard.slice(0, 10));
    } catch (error) {
      client.emit('error', { message: 'Failed to submit answer' });
    }
  }

  @SubscribeMessage('next_question')
  async handleNextQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; hostId: string },
  ) {
    try {
      const session = await this.gamesService.findByRoomCode(payload.roomCode);

      if (session.hostId !== payload.hostId) {
        return;
      }

      const gameState = await this.getGameState(payload.roomCode);
      const questions = session.questions as Array<{
        id: string;
        question: string;
        options: string[];
        timeLimit: number;
        points: number;
      }>;

      const nextIndex = gameState.currentQuestion + 1;

      if (nextIndex >= questions.length) {
        // Game finished
        await this.endGame(payload.roomCode, session.id);
      } else {
        // Send next question
        await this.updateGameState(payload.roomCode, { currentQuestion: nextIndex });
        this.sendQuestion(payload.roomCode, questions[nextIndex], nextIndex, questions.length);
      }
    } catch (error) {
      client.emit('error', { message: 'Failed to advance question' });
    }
  }

  @SubscribeMessage('end_game')
  async handleEndGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; hostId: string },
  ) {
    try {
      const session = await this.gamesService.findByRoomCode(payload.roomCode);

      if (session.hostId !== payload.hostId) {
        return;
      }

      await this.endGame(payload.roomCode, session.id);
    } catch (error) {
      client.emit('error', { message: 'Failed to end game' });
    }
  }

  private sendQuestion(
    roomCode: string,
    question: { id: string; question: string; options: string[]; timeLimit: number; points: number },
    index: number,
    total: number,
  ) {
    this.server.to(roomCode).emit('question', {
      questionId: question.id,
      questionText: question.question,
      options: question.options,
      timeLimit: question.timeLimit,
      points: question.points,
      questionNumber: index + 1,
      totalQuestions: total,
    });
  }

  private async endGame(roomCode: string, sessionId: string) {
    await this.gamesService.updateStatus(sessionId, GameStatus.FINISHED);
    await this.gamesService.awardXP(sessionId);

    const results = await this.gamesService.getResults(sessionId);

    this.server.to(roomCode).emit('game_finished', results);

    // Clean up Redis
    await this.redis.del(`game:${roomCode}`);
  }

  private async getGameState(roomCode: string): Promise<GameState> {
    const cached = await this.redis.get(`game:${roomCode}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const session = await this.gamesService.findByRoomCode(roomCode);
    return {
      id: session.id,
      status: session.status,
      currentQuestion: 0,
      participants: [],
    };
  }

  private async updateGameState(
    roomCode: string,
    updates: Partial<GameState>,
  ) {
    const current = await this.getGameState(roomCode);
    const updated = { ...current, ...updates };
    await this.redis.set(`game:${roomCode}`, JSON.stringify(updated), 3600 * 2);
    return updated;
  }
}
