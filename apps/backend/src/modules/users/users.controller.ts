import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateUserDto, UpdateStudentProfileDto } from './dto/user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: { user: { userId: string } }) {
    return this.usersService.findById(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @Req() req: { user: { userId: string } },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Put('profile/student')
  @ApiOperation({ summary: 'Update student profile (DSA/BES settings)' })
  async updateStudentProfile(
    @Req() req: { user: { userId: string } },
    @Body() updateDto: UpdateStudentProfileDto,
  ) {
    return this.usersService.updateStudentProfile(req.user.userId, updateDto);
  }

  @Get(':id/xp')
  @ApiOperation({ summary: 'Get user XP and rewards' })
  async getXP(@Param('id') id: string) {
    return this.usersService.getXPSummary(id);
  }

  @Get(':id/badges')
  @ApiOperation({ summary: 'Get user badges' })
  async getBadges(@Param('id') id: string) {
    return this.usersService.getBadges(id);
  }
}
