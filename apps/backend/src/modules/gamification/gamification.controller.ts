import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GamificationService } from './gamification.service';

@Controller('gamification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // Get all badge definitions
  @Get('badges')
  async getAllBadges() {
    return this.gamificationService.getBadgeDefinitions();
  }

  // Get badge by ID
  @Get('badges/:id')
  async getBadge(@Param('id') id: string) {
    return this.gamificationService.getBadgeDefinition(id);
  }

  // Get current user's stats
  @Get('stats')
  async getMyStats(@Request() req: any) {
    return this.gamificationService.getUserStats(req.user.id);
  }

  // Get another user's stats (for teachers)
  @Get('stats/:userId')
  @Roles('teacher', 'admin')
  async getUserStats(@Param('userId') userId: string) {
    return this.gamificationService.getUserStats(userId);
  }

  // Get current user's badges
  @Get('my-badges')
  async getMyBadges(@Request() req: any) {
    return this.gamificationService.getUserBadges(req.user.id);
  }

  // Get leaderboard
  @Get('leaderboard')
  async getLeaderboard(
    @Query('classroomId') classroomId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.gamificationService.getLeaderboard(
      classroomId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  // Calculate level from XP (utility endpoint)
  @Get('level/:xp')
  async calculateLevel(@Param('xp') xp: string) {
    return this.gamificationService.calculateLevel(parseInt(xp, 10));
  }

  // Award XP (admin/teacher only)
  @Post('award-xp')
  @Roles('teacher', 'admin')
  async awardXP(
    @Body() body: { userId: string; amount: number; source: string },
  ) {
    return this.gamificationService.awardXP({
      userId: body.userId,
      amount: body.amount,
      source: body.source,
    });
  }

  // Award badge (admin/teacher only)
  @Post('award-badge')
  @Roles('teacher', 'admin')
  async awardBadge(@Body() body: { userId: string; badgeId: string }) {
    return this.gamificationService.awardBadge(body.userId, body.badgeId);
  }
}
