import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateGameDto } from './dto/game.dto';

@ApiTags('games')
@Controller('games')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create new game session' })
  async create(
    @Req() req: { user: { userId: string } },
    @Body() createDto: CreateGameDto,
  ) {
    return this.gamesService.createSession(req.user.userId, createDto);
  }

  @Get('classroom/:classroomId')
  @ApiOperation({ summary: 'Get games for classroom' })
  async findByClassroom(@Param('classroomId') classroomId: string) {
    return this.gamesService.findByClassroom(classroomId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get game session by ID' })
  async findOne(@Param('id') id: string) {
    return this.gamesService.findById(id);
  }

  @Get('room/:code')
  @ApiOperation({ summary: 'Get game by room code' })
  async findByCode(@Param('code') code: string) {
    return this.gamesService.findByRoomCode(code);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get game leaderboard' })
  async getLeaderboard(@Param('id') id: string) {
    return this.gamesService.getLeaderboard(id);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get game results' })
  async getResults(@Param('id') id: string) {
    return this.gamesService.getResults(id);
  }

  @Get('types/available')
  @ApiOperation({ summary: 'Get available game types' })
  async getGameTypes() {
    return this.gamesService.getGameTypes();
  }
}
