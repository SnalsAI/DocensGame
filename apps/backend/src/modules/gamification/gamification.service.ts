import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: 'LEARNING' | 'GAMING' | 'SOCIAL' | 'SPECIAL';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  xpReward: number;
  condition: BadgeCondition;
}

export interface BadgeCondition {
  type: string;
  threshold: number;
  metadata?: Record<string, unknown>;
}

export interface XPEvent {
  userId: string;
  amount: number;
  source: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

// Badge definitions
const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Learning badges
  {
    id: 'first_lesson',
    name: 'Primo Passo',
    description: 'Completa la tua prima lezione',
    iconUrl: '/badges/first-lesson.png',
    category: 'LEARNING',
    rarity: 'COMMON',
    xpReward: 50,
    condition: { type: 'lessons_completed', threshold: 1 },
  },
  {
    id: 'knowledge_seeker',
    name: 'Cercatore di Conoscenza',
    description: 'Completa 10 lezioni',
    iconUrl: '/badges/knowledge-seeker.png',
    category: 'LEARNING',
    rarity: 'RARE',
    xpReward: 200,
    condition: { type: 'lessons_completed', threshold: 10 },
  },
  {
    id: 'scholar',
    name: 'Studioso',
    description: 'Completa 50 lezioni',
    iconUrl: '/badges/scholar.png',
    category: 'LEARNING',
    rarity: 'EPIC',
    xpReward: 500,
    condition: { type: 'lessons_completed', threshold: 50 },
  },
  {
    id: 'master_learner',
    name: 'Maestro Apprendista',
    description: 'Completa 100 lezioni',
    iconUrl: '/badges/master-learner.png',
    category: 'LEARNING',
    rarity: 'LEGENDARY',
    xpReward: 1000,
    condition: { type: 'lessons_completed', threshold: 100 },
  },
  {
    id: 'quiz_ace',
    name: 'Asso dei Quiz',
    description: 'Rispondi correttamente a 100 domande',
    iconUrl: '/badges/quiz-ace.png',
    category: 'LEARNING',
    rarity: 'RARE',
    xpReward: 300,
    condition: { type: 'correct_answers', threshold: 100 },
  },
  {
    id: 'perfect_score',
    name: 'Punteggio Perfetto',
    description: 'Ottieni il 100% in un quiz',
    iconUrl: '/badges/perfect-score.png',
    category: 'LEARNING',
    rarity: 'RARE',
    xpReward: 150,
    condition: { type: 'perfect_quiz', threshold: 1 },
  },

  // Gaming badges
  {
    id: 'first_victory',
    name: 'Prima Vittoria',
    description: 'Vinci la tua prima partita',
    iconUrl: '/badges/first-victory.png',
    category: 'GAMING',
    rarity: 'COMMON',
    xpReward: 75,
    condition: { type: 'games_won', threshold: 1 },
  },
  {
    id: 'champion',
    name: 'Campione',
    description: 'Vinci 10 partite',
    iconUrl: '/badges/champion.png',
    category: 'GAMING',
    rarity: 'RARE',
    xpReward: 300,
    condition: { type: 'games_won', threshold: 10 },
  },
  {
    id: 'undefeated',
    name: 'Imbattuto',
    description: 'Vinci 5 partite consecutive',
    iconUrl: '/badges/undefeated.png',
    category: 'GAMING',
    rarity: 'EPIC',
    xpReward: 400,
    condition: { type: 'win_streak', threshold: 5 },
  },
  {
    id: 'boss_slayer',
    name: 'Uccisore di Boss',
    description: 'Sconfiggi il tuo primo boss',
    iconUrl: '/badges/boss-slayer.png',
    category: 'GAMING',
    rarity: 'RARE',
    xpReward: 250,
    condition: { type: 'bosses_defeated', threshold: 1 },
  },
  {
    id: 'dungeon_master',
    name: 'Signore dei Dungeon',
    description: 'Completa 10 dungeon',
    iconUrl: '/badges/dungeon-master.png',
    category: 'GAMING',
    rarity: 'EPIC',
    xpReward: 500,
    condition: { type: 'dungeons_completed', threshold: 10 },
  },
  {
    id: 'speed_demon',
    name: 'Demone della Velocità',
    description: 'Rispondi correttamente in meno di 3 secondi 50 volte',
    iconUrl: '/badges/speed-demon.png',
    category: 'GAMING',
    rarity: 'EPIC',
    xpReward: 350,
    condition: { type: 'fast_answers', threshold: 50 },
  },
  {
    id: 'streak_master',
    name: 'Maestro delle Serie',
    description: 'Ottieni una serie di 10 risposte corrette',
    iconUrl: '/badges/streak-master.png',
    category: 'GAMING',
    rarity: 'RARE',
    xpReward: 200,
    condition: { type: 'answer_streak', threshold: 10 },
  },

  // Social badges
  {
    id: 'team_player',
    name: 'Giocatore di Squadra',
    description: 'Partecipa a 5 giochi di squadra',
    iconUrl: '/badges/team-player.png',
    category: 'SOCIAL',
    rarity: 'COMMON',
    xpReward: 100,
    condition: { type: 'team_games', threshold: 5 },
  },
  {
    id: 'class_hero',
    name: 'Eroe della Classe',
    description: 'Finisci primo nella classifica 5 volte',
    iconUrl: '/badges/class-hero.png',
    category: 'SOCIAL',
    rarity: 'EPIC',
    xpReward: 400,
    condition: { type: 'first_place', threshold: 5 },
  },
  {
    id: 'helper',
    name: 'Aiutante',
    description: 'Aiuta un compagno durante un Boss Fight',
    iconUrl: '/badges/helper.png',
    category: 'SOCIAL',
    rarity: 'RARE',
    xpReward: 150,
    condition: { type: 'team_assists', threshold: 1 },
  },

  // Special badges
  {
    id: 'early_bird',
    name: 'Mattiniero',
    description: 'Completa una lezione prima delle 8:00',
    iconUrl: '/badges/early-bird.png',
    category: 'SPECIAL',
    rarity: 'RARE',
    xpReward: 100,
    condition: { type: 'early_morning', threshold: 1 },
  },
  {
    id: 'night_owl',
    name: 'Nottambulo',
    description: 'Completa una lezione dopo le 21:00',
    iconUrl: '/badges/night-owl.png',
    category: 'SPECIAL',
    rarity: 'RARE',
    xpReward: 100,
    condition: { type: 'late_night', threshold: 1 },
  },
  {
    id: 'weekly_warrior',
    name: 'Guerriero Settimanale',
    description: 'Gioca ogni giorno per una settimana',
    iconUrl: '/badges/weekly-warrior.png',
    category: 'SPECIAL',
    rarity: 'EPIC',
    xpReward: 300,
    condition: { type: 'daily_streak', threshold: 7 },
  },
  {
    id: 'comeback_kid',
    name: 'Re della Rimonta',
    description: 'Vinci una partita dopo essere stato ultimo',
    iconUrl: '/badges/comeback-kid.png',
    category: 'SPECIAL',
    rarity: 'LEGENDARY',
    xpReward: 500,
    condition: { type: 'comeback_victory', threshold: 1 },
  },
];

// XP levels configuration
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100, // 1-10
  5050, 6100, 7250, 8500, 9850, 11300, 12850, 14500, 16250, 18100, // 11-20
  20050, 22100, 24250, 26500, 28850, 31300, 33850, 36500, 39250, 42100, // 21-30
];

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Get all badge definitions
  getBadgeDefinitions(): BadgeDefinition[] {
    return BADGE_DEFINITIONS;
  }

  // Get badge by ID
  getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
    return BADGE_DEFINITIONS.find((b) => b.id === badgeId);
  }

  // Calculate level from XP
  calculateLevel(xp: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }

    const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextLevelXP = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;
    const xpInLevel = xp - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const progress = Math.min(100, (xpInLevel / xpNeeded) * 100);

    return {
      level,
      currentXP: xpInLevel,
      nextLevelXP: xpNeeded,
      progress,
    };
  }

  // Award XP to a user
  async awardXP(event: XPEvent): Promise<{ totalXP: number; levelUp: boolean; newLevel?: number }> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: event.userId },
    });

    if (!student) {
      this.logger.warn(`Student profile not found for user ${event.userId}`);
      return { totalXP: 0, levelUp: false };
    }

    const previousXP = student.totalXP;
    const previousLevel = this.calculateLevel(previousXP).level;
    const newXP = previousXP + event.amount;
    const newLevel = this.calculateLevel(newXP).level;
    const levelUp = newLevel > previousLevel;

    // Update XP in database
    await this.prisma.studentProfile.update({
      where: { userId: event.userId },
      data: { totalXP: newXP },
    });

    // Record XP event
    await this.prisma.xPReward.create({
      data: {
        studentId: student.id,
        amount: event.amount,
        source: event.source,
        metadata: event.metadata as any,
      },
    });

    // Emit events
    this.eventEmitter.emit('xp.awarded', {
      userId: event.userId,
      amount: event.amount,
      totalXP: newXP,
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
    });

    if (levelUp) {
      this.eventEmitter.emit('level.up', {
        userId: event.userId,
        newLevel,
        previousLevel,
      });
    }

    return { totalXP: newXP, levelUp, newLevel: levelUp ? newLevel : undefined };
  }

  // Check and award badges based on user stats
  async checkAndAwardBadges(userId: string, stats: Record<string, number>): Promise<string[]> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { badges: true },
    });

    if (!student) {
      return [];
    }

    const existingBadgeIds = student.badges.map((b) => b.badgeId);
    const newBadges: string[] = [];

    for (const badge of BADGE_DEFINITIONS) {
      // Skip if already has badge
      if (existingBadgeIds.includes(badge.id)) {
        continue;
      }

      // Check if condition is met
      const statValue = stats[badge.condition.type] || 0;
      if (statValue >= badge.condition.threshold) {
        // Award badge
        await this.awardBadge(userId, badge.id);
        newBadges.push(badge.id);
      }
    }

    return newBadges;
  }

  // Award a specific badge to a user
  async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    const badge = this.getBadgeDefinition(badgeId);
    if (!badge) {
      this.logger.warn(`Badge definition not found: ${badgeId}`);
      return false;
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!student) {
      this.logger.warn(`Student profile not found for user ${userId}`);
      return false;
    }

    // Check if already has badge
    const existingBadge = await this.prisma.userBadge.findFirst({
      where: { studentId: student.id, badgeId },
    });

    if (existingBadge) {
      return false;
    }

    // Create user badge
    await this.prisma.userBadge.create({
      data: {
        studentId: student.id,
        badgeId,
        earnedAt: new Date(),
      },
    });

    // Award XP for badge
    await this.awardXP({
      userId,
      amount: badge.xpReward,
      source: 'badge',
      sourceId: badgeId,
      metadata: { badgeName: badge.name },
    });

    // Emit badge earned event
    this.eventEmitter.emit('badge.earned', {
      userId,
      badge,
    });

    this.logger.log(`Badge ${badgeId} awarded to user ${userId}`);
    return true;
  }

  // Get user's badges
  async getUserBadges(userId: string): Promise<{ badge: BadgeDefinition; earnedAt: Date }[]> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { badges: true },
    });

    if (!student) {
      return [];
    }

    return student.badges.map((ub) => ({
      badge: this.getBadgeDefinition(ub.badgeId)!,
      earnedAt: ub.earnedAt,
    })).filter((b) => b.badge);
  }

  // Get user's gamification stats
  async getUserStats(userId: string): Promise<{
    level: number;
    totalXP: number;
    currentXP: number;
    nextLevelXP: number;
    progress: number;
    badges: { badge: BadgeDefinition; earnedAt: Date }[];
    recentXP: { amount: number; source: string; createdAt: Date }[];
  }> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        badges: true,
        xpRewards: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return {
        level: 1,
        totalXP: 0,
        currentXP: 0,
        nextLevelXP: 100,
        progress: 0,
        badges: [],
        recentXP: [],
      };
    }

    const levelInfo = this.calculateLevel(student.totalXP);
    const badges = student.badges.map((ub) => ({
      badge: this.getBadgeDefinition(ub.badgeId)!,
      earnedAt: ub.earnedAt,
    })).filter((b) => b.badge);

    return {
      level: levelInfo.level,
      totalXP: student.totalXP,
      currentXP: levelInfo.currentXP,
      nextLevelXP: levelInfo.nextLevelXP,
      progress: levelInfo.progress,
      badges,
      recentXP: student.xpRewards.map((xp) => ({
        amount: xp.amount,
        source: xp.source,
        createdAt: xp.createdAt,
      })),
    };
  }

  // Get leaderboard
  async getLeaderboard(classroomId?: string, limit = 10): Promise<{
    rank: number;
    userId: string;
    name: string;
    level: number;
    totalXP: number;
    badgeCount: number;
  }[]> {
    const whereClause = classroomId
      ? {
          classrooms: {
            some: { id: classroomId },
          },
        }
      : {};

    const students = await this.prisma.studentProfile.findMany({
      where: whereClause,
      include: {
        user: true,
        badges: true,
      },
      orderBy: { totalXP: 'desc' },
      take: limit,
    });

    return students.map((student, index) => ({
      rank: index + 1,
      userId: student.userId,
      name: student.user.displayName || student.user.email,
      level: this.calculateLevel(student.totalXP).level,
      totalXP: student.totalXP,
      badgeCount: student.badges.length,
    }));
  }

  // Record game result and update stats
  async recordGameResult(
    userId: string,
    gameResult: {
      gameType: string;
      won: boolean;
      position: number;
      totalPlayers: number;
      correctAnswers: number;
      totalQuestions: number;
      fastAnswers: number;
      maxStreak: number;
      isTeamGame: boolean;
      isBossGame: boolean;
      bossDefeated?: boolean;
      isDungeonGame: boolean;
      dungeonCompleted?: boolean;
      comebackVictory?: boolean;
    },
  ): Promise<{ xpAwarded: number; newBadges: string[] }> {
    // Calculate XP based on performance
    let xpAwarded = 0;

    // Base XP for participation
    xpAwarded += 10;

    // XP for correct answers
    xpAwarded += gameResult.correctAnswers * 5;

    // Bonus for winning
    if (gameResult.won) {
      xpAwarded += 50;
    }

    // Position bonus
    if (gameResult.position === 1) {
      xpAwarded += 30;
    } else if (gameResult.position === 2) {
      xpAwarded += 20;
    } else if (gameResult.position === 3) {
      xpAwarded += 10;
    }

    // Perfect score bonus
    if (gameResult.correctAnswers === gameResult.totalQuestions) {
      xpAwarded += 25;
    }

    // Award XP
    await this.awardXP({
      userId,
      amount: xpAwarded,
      source: 'game',
      metadata: gameResult,
    });

    // Update user stats and check badges
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!student) {
      return { xpAwarded, newBadges: [] };
    }

    // Build stats object for badge checking
    const stats: Record<string, number> = {
      games_won: gameResult.won ? 1 : 0,
      correct_answers: gameResult.correctAnswers,
      fast_answers: gameResult.fastAnswers,
      answer_streak: gameResult.maxStreak,
      first_place: gameResult.position === 1 ? 1 : 0,
      team_games: gameResult.isTeamGame ? 1 : 0,
      bosses_defeated: gameResult.bossDefeated ? 1 : 0,
      dungeons_completed: gameResult.dungeonCompleted ? 1 : 0,
      comeback_victory: gameResult.comebackVictory ? 1 : 0,
      perfect_quiz: gameResult.correctAnswers === gameResult.totalQuestions ? 1 : 0,
    };

    // Get cumulative stats from database
    const cumulativeStats = await this.getCumulativeStats(userId);
    for (const [key, value] of Object.entries(cumulativeStats)) {
      stats[key] = (stats[key] || 0) + value;
    }

    const newBadges = await this.checkAndAwardBadges(userId, stats);

    return { xpAwarded, newBadges };
  }

  // Get cumulative stats for a user
  private async getCumulativeStats(userId: string): Promise<Record<string, number>> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        gameSessions: {
          include: {
            players: {
              where: { oderId: { not: undefined } },
            },
          },
        },
      },
    });

    if (!student) {
      return {};
    }

    // This would normally aggregate from game history
    // For now, return empty - would be implemented based on actual game records
    return {};
  }
}
