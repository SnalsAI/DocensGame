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
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateLessonDto, AddInteractionDto } from './dto/lesson.dto';

@ApiTags('lessons')
@Controller('lessons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create video lesson from content' })
  async create(@Body() createDto: CreateLessonDto) {
    return this.lessonsService.create(createDto);
  }

  @Get('content/:contentId')
  @ApiOperation({ summary: 'Get lessons for content' })
  async findByContent(@Param('contentId') contentId: string) {
    return this.lessonsService.findByContent(contentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findById(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get lesson generation status' })
  async getStatus(@Param('id') id: string) {
    return this.lessonsService.getStatus(id);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete lesson' })
  async remove(@Param('id') id: string) {
    return this.lessonsService.delete(id);
  }

  @Post(':id/interactions')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Add interaction (H5P) to video' })
  async addInteraction(
    @Param('id') id: string,
    @Body() interactionDto: AddInteractionDto,
  ) {
    return this.lessonsService.addInteraction(id, interactionDto);
  }

  @Get(':id/interactions')
  @ApiOperation({ summary: 'Get interactions for video' })
  async getInteractions(@Param('id') id: string) {
    return this.lessonsService.getInteractions(id);
  }

  @Delete(':id/interactions/:interactionId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Remove interaction from video' })
  async removeInteraction(
    @Param('id') id: string,
    @Param('interactionId') interactionId: string,
  ) {
    return this.lessonsService.removeInteraction(interactionId);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Record video view' })
  async recordView(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
    @Body() viewData: { duration: number; completed: boolean },
  ) {
    return this.lessonsService.recordView(
      id,
      req.user.userId,
      viewData.duration,
      viewData.completed,
    );
  }
}
