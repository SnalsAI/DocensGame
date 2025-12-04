import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { AIClientService } from './ai-client.service';
import { CreateContentDto, UpdateContentDto, GenerateQuizDto } from './dto/content.dto';
import { ContentStatus, ContentType, QuizType, SummaryType } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly aiClient: AIClientService,
  ) {}

  async create(authorId: string, createDto: CreateContentDto) {
    return this.prisma.content.create({
      data: {
        ...createDto,
        authorId,
        type: createDto.type || ContentType.TEXT,
        status: ContentStatus.DRAFT,
      },
    });
  }

  async createWithFile(
    authorId: string,
    createDto: CreateContentDto,
    file: Express.Multer.File,
  ) {
    // Upload file to storage
    const filePath = `content/${authorId}/${Date.now()}-${file.originalname}`;
    const fileUrl = await this.storage.uploadFile(
      filePath,
      file.buffer,
      file.mimetype,
    );

    // Determine content type from file
    let type = ContentType.TEXT;
    if (file.mimetype === 'application/pdf') {
      type = ContentType.PDF;
    } else if (file.mimetype.startsWith('image/')) {
      type = ContentType.IMAGE;
    }

    return this.prisma.content.create({
      data: {
        ...createDto,
        authorId,
        type,
        fileUrl,
        status: ContentStatus.DRAFT,
      },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.content.findMany({
      where: { authorId: userId },
      include: {
        classroom: { select: { id: true, name: true } },
        _count: {
          select: { videoLessons: true, quizzes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClassroom(classroomId: string) {
    return this.prisma.content.findMany({
      where: { classroomId, status: ContentStatus.READY },
      include: {
        author: { select: { firstName: true, lastName: true } },
        _count: {
          select: { videoLessons: true, quizzes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        classroom: true,
        author: { select: { firstName: true, lastName: true } },
        videoLessons: true,
        quizzes: true,
        conceptMaps: true,
        summaries: true,
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async update(id: string, updateDto: UpdateContentDto) {
    return this.prisma.content.update({
      where: { id },
      data: updateDto,
    });
  }

  async delete(id: string) {
    return this.prisma.content.delete({ where: { id } });
  }

  async parseContent(id: string) {
    const content = await this.findById(id);

    await this.prisma.content.update({
      where: { id },
      data: { status: ContentStatus.PROCESSING },
    });

    try {
      const parsedData = await this.aiClient.parseContent(
        content.rawContent || '',
        content.fileUrl || undefined,
      );

      return this.prisma.content.update({
        where: { id },
        data: {
          parsedData,
          status: ContentStatus.READY,
        },
      });
    } catch {
      await this.prisma.content.update({
        where: { id },
        data: { status: ContentStatus.ERROR },
      });
      throw new Error('Failed to parse content');
    }
  }

  async generateSummary(id: string, type: SummaryType = SummaryType.BRIEF) {
    const content = await this.findById(id);
    const text = content.rawContent || JSON.stringify(content.parsedData);

    const summaryText = await this.aiClient.summarize(text, type);

    return this.prisma.summary.create({
      data: {
        contentId: id,
        type,
        text: summaryText,
      },
    });
  }

  async generateConceptMap(id: string) {
    const content = await this.findById(id);
    const text = content.rawContent || JSON.stringify(content.parsedData);

    const { nodes, edges } = await this.aiClient.generateConceptMap(text);

    return this.prisma.conceptMap.create({
      data: {
        contentId: id,
        title: `Mappa: ${content.title}`,
        nodes,
        edges,
      },
    });
  }

  async generateQuiz(id: string, generateDto: GenerateQuizDto) {
    const content = await this.findById(id);
    const text = content.rawContent || JSON.stringify(content.parsedData);

    const questions = await this.aiClient.generateQuiz(
      text,
      generateDto.type,
      generateDto.numQuestions,
    );

    return this.prisma.quiz.create({
      data: {
        contentId: id,
        title: generateDto.title || `Quiz: ${content.title}`,
        type: generateDto.type,
        questions,
        settings: {
          timeLimit: generateDto.timeLimit,
          shuffleQuestions: generateDto.shuffleQuestions,
          showFeedback: generateDto.showFeedback,
        },
      },
    });
  }

  async getQuizzes(contentId: string) {
    return this.prisma.quiz.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
