import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClassroomsService } from './classrooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateClassroomDto, UpdateClassroomDto, JoinClassroomDto } from './dto/classroom.dto';

@ApiTags('classrooms')
@Controller('classrooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new classroom' })
  async create(
    @Req() req: { user: { userId: string } },
    @Body() createDto: CreateClassroomDto,
  ) {
    return this.classroomsService.create(req.user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classrooms for current user' })
  async findAll(@Req() req: { user: { userId: string; role: string } }) {
    return this.classroomsService.findAllForUser(req.user.userId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get classroom by ID' })
  async findOne(@Param('id') id: string) {
    return this.classroomsService.findById(id);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get students in classroom' })
  async getStudents(@Param('id') id: string) {
    return this.classroomsService.getStudents(id);
  }

  @Put(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update classroom' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateClassroomDto,
  ) {
    return this.classroomsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete classroom' })
  async remove(@Param('id') id: string) {
    return this.classroomsService.delete(id);
  }

  @Post('join')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Join classroom with code' })
  async join(
    @Req() req: { user: { userId: string } },
    @Body() joinDto: JoinClassroomDto,
  ) {
    return this.classroomsService.joinByCode(req.user.userId, joinDto.code);
  }

  @Delete(':id/leave')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Leave classroom' })
  async leave(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.classroomsService.leave(id, req.user.userId);
  }
}
