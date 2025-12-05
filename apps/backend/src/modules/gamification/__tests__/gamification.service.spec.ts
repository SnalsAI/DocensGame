import { Test, TestingModule } from '@nestjs/testing';
import { GamificationService } from '../gamification.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('GamificationService', () => {
  let service: GamificationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    xPReward: {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    badge: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userBadge: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('awardXP', () => {
    it('should award XP to a user', async () => {
      const userId = 'user-123';
      const amount = 100;
      const source = 'QUIZ_COMPLETED';

      mockPrismaService.xPReward.create.mockResolvedValue({
        id: 'xp-123',
        userId,
        amount,
        source,
        createdAt: new Date(),
      });

      const result = await service.awardXP(userId, amount, source);

      expect(mockPrismaService.xPReward.create).toHaveBeenCalledWith({
        data: {
          userId,
          amount,
          source,
        },
      });
      expect(result.amount).toBe(amount);
    });

    it('should not award negative XP', async () => {
      const userId = 'user-123';
      const amount = -50;
      const source = 'QUIZ_COMPLETED';

      await expect(service.awardXP(userId, amount, source)).rejects.toThrow(
        'XP amount must be positive',
      );
    });
  });

  describe('getTotalXP', () => {
    it('should return total XP for a user', async () => {
      const userId = 'user-123';

      mockPrismaService.xPReward.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
      });

      const result = await service.getTotalXP(userId);

      expect(result).toBe(500);
      expect(mockPrismaService.xPReward.aggregate).toHaveBeenCalledWith({
        where: { userId },
        _sum: { amount: true },
      });
    });

    it('should return 0 for user with no XP', async () => {
      const userId = 'user-new';

      mockPrismaService.xPReward.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.getTotalXP(userId);

      expect(result).toBe(0);
    });
  });

  describe('calculateLevel', () => {
    it('should calculate level 1 for 0 XP', () => {
      const result = service.calculateLevel(0);
      expect(result).toBe(1);
    });

    it('should calculate level 2 for 100 XP', () => {
      const result = service.calculateLevel(100);
      expect(result).toBe(2);
    });

    it('should calculate level 5 for 1000 XP', () => {
      const result = service.calculateLevel(1000);
      expect(result).toBe(5);
    });

    it('should cap at level 30', () => {
      const result = service.calculateLevel(999999);
      expect(result).toBe(30);
    });
  });

  describe('checkAndAwardBadge', () => {
    it('should award badge if criteria met and not already earned', async () => {
      const userId = 'user-123';
      const badgeId = 'badge-first-quiz';

      mockPrismaService.userBadge.findUnique.mockResolvedValue(null);
      mockPrismaService.badge.findUnique.mockResolvedValue({
        id: badgeId,
        name: 'Prima Risposta',
        xpValue: 30,
      });
      mockPrismaService.userBadge.create.mockResolvedValue({
        id: 'user-badge-123',
        userId,
        badgeId,
        earnedAt: new Date(),
      });

      const result = await service.checkAndAwardBadge(userId, badgeId);

      expect(result).toBeTruthy();
      expect(mockPrismaService.userBadge.create).toHaveBeenCalled();
    });

    it('should not award badge if already earned', async () => {
      const userId = 'user-123';
      const badgeId = 'badge-first-quiz';

      mockPrismaService.userBadge.findUnique.mockResolvedValue({
        id: 'existing-badge',
        userId,
        badgeId,
        earnedAt: new Date(),
      });

      const result = await service.checkAndAwardBadge(userId, badgeId);

      expect(result).toBeNull();
      expect(mockPrismaService.userBadge.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserBadges', () => {
    it('should return all badges for a user', async () => {
      const userId = 'user-123';
      const mockBadges = [
        {
          id: 'ub-1',
          badge: { id: 'b1', name: 'Badge 1', iconUrl: '/badges/1.svg' },
          earnedAt: new Date(),
        },
        {
          id: 'ub-2',
          badge: { id: 'b2', name: 'Badge 2', iconUrl: '/badges/2.svg' },
          earnedAt: new Date(),
        },
      ];

      mockPrismaService.userBadge.findMany.mockResolvedValue(mockBadges);

      const result = await service.getUserBadges(userId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.userBadge.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      });
    });
  });

  describe('getLeaderboard', () => {
    it('should return top users by XP', async () => {
      const mockLeaderboard = [
        { id: 'u1', firstName: 'Mario', lastName: 'Rossi', totalXp: 1000 },
        { id: 'u2', firstName: 'Giulia', lastName: 'Bianchi', totalXp: 800 },
        { id: 'u3', firstName: 'Marco', lastName: 'Verdi', totalXp: 600 },
      ];

      mockPrismaService.user.findMany = jest.fn().mockResolvedValue(mockLeaderboard);

      const result = await service.getLeaderboard(10);

      expect(result).toHaveLength(3);
      expect(result[0].totalXp).toBe(1000);
    });

    it('should limit results to specified count', async () => {
      const mockLeaderboard = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `u${i}`,
          firstName: `User${i}`,
          lastName: 'Test',
          totalXp: 1000 - i * 100,
        }));

      mockPrismaService.user.findMany = jest.fn().mockResolvedValue(mockLeaderboard.slice(0, 3));

      const result = await service.getLeaderboard(3);

      expect(result).toHaveLength(3);
    });
  });

  describe('getXPHistory', () => {
    it('should return XP history for a user', async () => {
      const userId = 'user-123';
      const mockHistory = [
        { id: 'xp1', amount: 50, source: 'QUIZ_COMPLETED', createdAt: new Date() },
        { id: 'xp2', amount: 100, source: 'GAME_WIN', createdAt: new Date() },
      ];

      mockPrismaService.xPReward.findMany.mockResolvedValue(mockHistory);

      const result = await service.getXPHistory(userId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.xPReward.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });
});
