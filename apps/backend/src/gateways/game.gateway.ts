import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface Player {
  socketId: string;
  oduserId: string;
  nickname: string;
  avatarUrl?: string;
  score: number;
  isReady: boolean;
  role?: 'attacker' | 'healer' | 'defender';
}

interface GameRoom {
  roomCode: string;
  hostId: string;
  gameType: 'RAPID_QUIZ' | 'BOSS_FIGHT' | 'DUNGEON' | 'SQUAD_PUZZLE' | 'TOURNAMENT';
  status: 'waiting' | 'starting' | 'in_progress' | 'paused' | 'finished';
  players: Map<string, Player>;
  currentQuestion: number;
  questions: any[];
  settings: {
    maxPlayers: number;
    timePerQuestion: number;
    allowLateJoin: boolean;
  };
  gameState: any;
  createdAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('GameGateway');
  private rooms = new Map<string, GameRoom>();
  private playerRooms = new Map<string, string>(); // odId -> roomCode

  constructor(private jwtService: JwtService) {}

  afterInit() {
    this.logger.log('Game WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (token) {
        const payload = this.jwtService.verify(token);
        client.data.userId = payload.sub;
        client.data.userName = payload.name || payload.preferred_username;
        this.logger.log(`Client connected: ${client.id} (User: ${client.data.userId})`);
      } else {
        // Allow anonymous connections for spectators
        this.logger.log(`Anonymous client connected: ${client.id}`);
      }
    } catch (error) {
      this.logger.warn(`Invalid token for client ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const roomCode = this.playerRooms.get(client.id);
    if (roomCode) {
      this.handlePlayerLeave(client, roomCode);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ==================== ROOM MANAGEMENT ====================

  @SubscribeMessage('create_room')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameType: string; settings?: any },
  ) {
    const roomCode = this.generateRoomCode();

    const room: GameRoom = {
      roomCode,
      hostId: client.id,
      gameType: data.gameType as any,
      status: 'waiting',
      players: new Map(),
      currentQuestion: 0,
      questions: [],
      settings: {
        maxPlayers: data.settings?.maxPlayers || 30,
        timePerQuestion: data.settings?.timePerQuestion || 20,
        allowLateJoin: data.settings?.allowLateJoin ?? true,
      },
      gameState: {},
      createdAt: new Date(),
    };

    this.rooms.set(roomCode, room);
    client.join(roomCode);
    this.playerRooms.set(client.id, roomCode);

    // Add host as first player
    room.players.set(client.id, {
      socketId: client.id,
      oduserId: client.data.userId,
      nickname: client.data.userName || 'Host',
      score: 0,
      isReady: true,
    });

    this.logger.log(`Room created: ${roomCode} by ${client.id}`);

    client.emit('room_created', {
      roomCode,
      gameType: room.gameType,
      settings: room.settings,
    });

    return { success: true, roomCode };
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; nickname: string; avatarUrl?: string },
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.status !== 'waiting' && !room.settings.allowLateJoin) {
      return { success: false, error: 'Game already started' };
    }

    if (room.players.size >= room.settings.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    // Add player
    const player: Player = {
      socketId: client.id,
      oduserId: client.data.userId,
      nickname: data.nickname,
      avatarUrl: data.avatarUrl,
      score: 0,
      isReady: false,
    };

    room.players.set(client.id, player);
    client.join(data.roomCode);
    this.playerRooms.set(client.id, data.roomCode);

    // Notify all players
    this.server.to(data.roomCode).emit('player_joined', {
      player: this.sanitizePlayer(player),
      playerCount: room.players.size,
      players: this.getPlayerList(room),
    });

    this.logger.log(`Player ${data.nickname} joined room ${data.roomCode}`);

    return {
      success: true,
      gameType: room.gameType,
      status: room.status,
      players: this.getPlayerList(room),
      settings: room.settings,
    };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const roomCode = this.playerRooms.get(client.id);
    if (roomCode) {
      this.handlePlayerLeave(client, roomCode);
    }
    return { success: true };
  }

  private handlePlayerLeave(client: Socket, roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(client.id);
    room.players.delete(client.id);
    this.playerRooms.delete(client.id);
    client.leave(roomCode);

    // Notify remaining players
    this.server.to(roomCode).emit('player_left', {
      playerId: client.id,
      nickname: player?.nickname,
      playerCount: room.players.size,
      players: this.getPlayerList(room),
    });

    // If host left, assign new host or close room
    if (room.hostId === client.id) {
      if (room.players.size > 0) {
        const newHostId = room.players.keys().next().value;
        room.hostId = newHostId;
        this.server.to(roomCode).emit('host_changed', { newHostId });
      } else {
        this.rooms.delete(roomCode);
        this.logger.log(`Room ${roomCode} closed - no players left`);
      }
    }
  }

  // ==================== GAME FLOW ====================

  @SubscribeMessage('player_ready')
  handlePlayerReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ready: boolean },
  ) {
    const roomCode = this.playerRooms.get(client.id);
    if (!roomCode) return { success: false };

    const room = this.rooms.get(roomCode);
    if (!room) return { success: false };

    const player = room.players.get(client.id);
    if (player) {
      player.isReady = data.ready;
    }

    const readyCount = Array.from(room.players.values()).filter(p => p.isReady).length;

    this.server.to(roomCode).emit('ready_status_changed', {
      playerId: client.id,
      isReady: data.ready,
      readyCount,
      totalPlayers: room.players.size,
      allReady: readyCount === room.players.size,
    });

    return { success: true };
  }

  @SubscribeMessage('start_game')
  handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { questions: any[] },
  ) {
    const roomCode = this.playerRooms.get(client.id);
    if (!roomCode) return { success: false, error: 'Not in a room' };

    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    if (room.hostId !== client.id) {
      return { success: false, error: 'Only host can start the game' };
    }

    room.questions = data.questions;
    room.status = 'starting';
    room.currentQuestion = 0;

    // Initialize game state based on game type
    this.initializeGameState(room);

    this.server.to(roomCode).emit('game_starting', {
      countdown: 3,
      gameType: room.gameType,
      totalQuestions: room.questions.length,
    });

    // Start countdown
    setTimeout(() => {
      room.status = 'in_progress';
      this.sendQuestion(room);
    }, 3000);

    return { success: true };
  }

  @SubscribeMessage('submit_answer')
  handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { questionId: string; answer: any; timeSpent: number },
  ) {
    const roomCode = this.playerRooms.get(client.id);
    if (!roomCode) return { success: false };

    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'in_progress') return { success: false };

    const player = room.players.get(client.id);
    if (!player) return { success: false };

    const question = room.questions[room.currentQuestion];
    const isCorrect = this.checkAnswer(question, data.answer);

    // Calculate points based on speed and correctness
    let points = 0;
    if (isCorrect) {
      const timeBonus = Math.max(0, room.settings.timePerQuestion - data.timeSpent);
      points = 100 + Math.floor(timeBonus * 5);
      player.score += points;
    }

    // Emit answer result to player
    client.emit('answer_result', {
      correct: isCorrect,
      points,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      currentScore: player.score,
    });

    // Emit to host for live stats
    this.server.to(room.hostId).emit('player_answered', {
      playerId: client.id,
      nickname: player.nickname,
      correct: isCorrect,
      points,
    });

    return { success: true, correct: isCorrect, points };
  }

  @SubscribeMessage('next_question')
  handleNextQuestion(@ConnectedSocket() client: Socket) {
    const roomCode = this.playerRooms.get(client.id);
    if (!roomCode) return { success: false };

    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== client.id) return { success: false };

    room.currentQuestion++;

    if (room.currentQuestion >= room.questions.length) {
      this.endGame(room);
    } else {
      this.sendQuestion(room);
    }

    return { success: true };
  }

  // ==================== BOSS FIGHT SPECIFIC ====================

  @SubscribeMessage('boss_action')
  handleBossAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { action: 'attack' | 'heal' | 'defend'; target?: string },
  ) {
    const roomCode = this.playerRooms.get(client.id);
    if (!roomCode) return { success: false };

    const room = this.rooms.get(roomCode);
    if (!room || room.gameType !== 'BOSS_FIGHT') return { success: false };

    const player = room.players.get(client.id);
    if (!player) return { success: false };

    const gameState = room.gameState;
    let result: any = { action: data.action, playerId: client.id };

    switch (data.action) {
      case 'attack':
        const damage = 10 + Math.floor(Math.random() * 20);
        gameState.bossHealth = Math.max(0, gameState.bossHealth - damage);
        result.damage = damage;
        result.bossHealth = gameState.bossHealth;
        break;

      case 'heal':
        const healAmount = 15 + Math.floor(Math.random() * 10);
        gameState.teamHealth = Math.min(gameState.maxTeamHealth, gameState.teamHealth + healAmount);
        result.healAmount = healAmount;
        result.teamHealth = gameState.teamHealth;
        break;

      case 'defend':
        gameState.defenseActive = true;
        gameState.defensePlayerId = client.id;
        result.defenseActive = true;
        break;
    }

    this.server.to(roomCode).emit('boss_action_result', result);

    // Check win/lose conditions
    if (gameState.bossHealth <= 0) {
      this.server.to(roomCode).emit('boss_defeated', {
        players: this.getLeaderboard(room),
      });
      room.status = 'finished';
    }

    return { success: true, result };
  }

  // ==================== UTILITY METHODS ====================

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    // Ensure uniqueness
    while (this.rooms.has(code)) {
      code = this.generateRoomCode();
    }
    return code;
  }

  private sanitizePlayer(player: Player): Partial<Player> {
    return {
      socketId: player.socketId,
      nickname: player.nickname,
      avatarUrl: player.avatarUrl,
      score: player.score,
      isReady: player.isReady,
      role: player.role,
    };
  }

  private getPlayerList(room: GameRoom): Partial<Player>[] {
    return Array.from(room.players.values()).map(p => this.sanitizePlayer(p));
  }

  private getLeaderboard(room: GameRoom): any[] {
    return Array.from(room.players.values())
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        rank: i + 1,
        nickname: p.nickname,
        score: p.score,
        avatarUrl: p.avatarUrl,
      }));
  }

  private initializeGameState(room: GameRoom) {
    switch (room.gameType) {
      case 'BOSS_FIGHT':
        room.gameState = {
          bossHealth: 1000,
          maxBossHealth: 1000,
          teamHealth: 500,
          maxTeamHealth: 500,
          bossPhase: 1,
          defenseActive: false,
        };
        break;
      case 'DUNGEON':
        room.gameState = {
          currentRoom: 0,
          totalRooms: 10,
          inventory: { keys: 0, gold: 0, potions: 0 },
        };
        break;
      default:
        room.gameState = {};
    }
  }

  private sendQuestion(room: GameRoom) {
    const question = room.questions[room.currentQuestion];

    this.server.to(room.roomCode).emit('new_question', {
      questionNumber: room.currentQuestion + 1,
      totalQuestions: room.questions.length,
      question: {
        id: question.id,
        text: question.text,
        type: question.type,
        options: question.options,
        timeLimit: room.settings.timePerQuestion,
      },
    });
  }

  private checkAnswer(question: any, answer: any): boolean {
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.includes(answer);
    }
    return question.correctAnswer === answer;
  }

  private endGame(room: GameRoom) {
    room.status = 'finished';

    const leaderboard = this.getLeaderboard(room);

    this.server.to(room.roomCode).emit('game_ended', {
      leaderboard,
      winner: leaderboard[0],
      podium: leaderboard.slice(0, 3),
      stats: {
        totalQuestions: room.questions.length,
        duration: Date.now() - room.createdAt.getTime(),
      },
    });

    // Schedule room cleanup
    setTimeout(() => {
      this.rooms.delete(room.roomCode);
    }, 300000); // 5 minutes
  }
}
