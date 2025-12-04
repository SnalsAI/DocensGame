import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserDto, UpdateStudentProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async updateStudentProfile(userId: string, updateDto: UpdateStudentProfileDto) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    return this.prisma.studentProfile.update({
      where: { userId },
      data: updateDto,
    });
  }

  async getXPSummary(userId: string) {
    const rewards = await this.prisma.xPReward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalXP = rewards.reduce((sum, reward) => sum + reward.amount, 0);

    const bySource = rewards.reduce(
      (acc, reward) => {
        acc[reward.source] = (acc[reward.source] || 0) + reward.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalXP,
      bySource,
      recentRewards: rewards.slice(0, 10),
    };
  }

  async getBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: { earnedAt: 'desc' },
    });
  }

  async addXP(userId: string, amount: number, source: string, sourceId?: string) {
    return this.prisma.xPReward.create({
      data: {
        userId,
        amount,
        source: source as any,
        sourceId,
      },
    });
  }
}
