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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateContentDto, UpdateContentDto, GenerateQuizDto } from './dto/content.dto';

@ApiTags('content')
@Controller('content')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create new content' })
  async create(
    @Req() req: { user: { userId: string } },
    @Body() createDto: CreateContentDto,
  ) {
    return this.contentService.create(req.user.userId, createDto);
  }

  @Post('upload')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file content (PDF, image)' })
  async uploadFile(
    @Req() req: { user: { userId: string } },
    @UploadedFile() file: Express.Multer.File,
    @Body() createDto: CreateContentDto,
  ) {
    return this.contentService.createWithFile(req.user.userId, createDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all content for current user' })
  async findAll(@Req() req: { user: { userId: string } }) {
    return this.contentService.findAllForUser(req.user.userId);
  }

  @Get('classroom/:classroomId')
  @ApiOperation({ summary: 'Get content for classroom' })
  async findByClassroom(@Param('classroomId') classroomId: string) {
    return this.contentService.findByClassroom(classroomId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  async findOne(@Param('id') id: string) {
    return this.contentService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update content' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateContentDto,
  ) {
    return this.contentService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete content' })
  async remove(@Param('id') id: string) {
    return this.contentService.delete(id);
  }

  @Post(':id/parse')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Parse content with AI' })
  async parse(@Param('id') id: string) {
    return this.contentService.parseContent(id);
  }

  @Post(':id/summarize')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Generate summary with AI' })
  async summarize(@Param('id') id: string) {
    return this.contentService.generateSummary(id);
  }

  @Post(':id/concept-map')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Generate concept map with AI' })
  async conceptMap(@Param('id') id: string) {
    return this.contentService.generateConceptMap(id);
  }

  @Post(':id/quiz')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Generate quiz with AI' })
  async generateQuiz(
    @Param('id') id: string,
    @Body() generateDto: GenerateQuizDto,
  ) {
    return this.contentService.generateQuiz(id, generateDto);
  }

  @Get(':id/quizzes')
  @ApiOperation({ summary: 'Get quizzes for content' })
  async getQuizzes(@Param('id') id: string) {
    return this.contentService.getQuizzes(id);
  }
}
