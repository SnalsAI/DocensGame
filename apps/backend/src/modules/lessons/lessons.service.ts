import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { VideoClientService } from './video-client.service';
import { AIClientService } from '../content/ai-client.service';
import { CreateLessonDto, AddInteractionDto } from './dto/lesson.dto';
import { VideoStatus, XPSource } from '@prisma/client';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly videoClient: VideoClientService,
    private readonly aiClient: AIClientService,
  ) {}

  async create(createDto: CreateLessonDto) {
    // Get content
    const content = await this.prisma.content.findUnique({
      where: { id: createDto.contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Create lesson record
    const lesson = await this.prisma.videoLesson.create({
      data: {
        contentId: createDto.contentId,
        title: createDto.title || content.title,
        avatarId: createDto.avatarId,
        status: VideoStatus.PENDING,
      },
    });

    // Start async video generation pipeline
    this.generateVideoAsync(lesson.id, content.rawContent || '', createDto.avatarId);

    return lesson;
  }

  private async generateVideoAsync(
    lessonId: string,
    content: string,
    avatarId?: string,
  ) {
    try {
      // Step 1: Generate script
      await this.prisma.videoLesson.update({
        where: { id: lessonId },
        data: { status: VideoStatus.GENERATING_SCRIPT },
      });

      const script = await this.aiClient.generateScript(content);

      await this.prisma.videoLesson.update({
        where: { id: lessonId },
        data: { script },
      });

      // Step 2: Generate audio (TTS)
      await this.prisma.videoLesson.update({
        where: { id: lessonId },
        data: { status: VideoStatus.GENERATING_AUDIO },
      });

      const audioUrl = await this.videoClient.generateAudio(script);

      await this.prisma.videoLesson.update({
        where: { id: lessonId },
        data: { audioUrl },
      });

      // Step 3: Generate video (SadTalker)
      await this.prisma.videoLesson.update({
        where: { id: lessonId },
        data: { status: VideoStatus.GENERATING_VIDEO },
      });

      const { videoUrl, thumbnailUrl, duration } = await this.videoClient.generateVideo(
        audioUrl,
        avatarId,
      );

      // Step 4: Complete
      await this.prisma.videoLesson.update({
        where: { id: lessonId },
        data: {
          videoUrl,
          thumbnailUrl,
          duration,
          status: VideoStatus.READY,
        },
      });

      // Publish completion event
      await this.redis.publish(
        'video:completed',
        JSON.stringify({ lessonId, videoUrl }),
      );
    } catch (error) {
      await this.prisma.videoLesson.update({
        where: { id: lessonId },
        data: {
          status: VideoStatus.ERROR,
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  async findByContent(contentId: string) {
    return this.prisma.videoLesson.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const lesson = await this.prisma.videoLesson.findUnique({
      where: { id },
      include: {
        content: { select: { title: true, classroomId: true } },
        interactions: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async getStatus(id: string) {
    const lesson = await this.prisma.videoLesson.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        processingError: true,
        videoUrl: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async delete(id: string) {
    return this.prisma.videoLesson.delete({ where: { id } });
  }

  async addInteraction(lessonId: string, interactionDto: AddInteractionDto) {
    return this.prisma.videoInteraction.create({
      data: {
        videoLessonId: lessonId,
        type: interactionDto.type,
        timestamp: interactionDto.timestamp,
        data: interactionDto.data,
      },
    });
  }

  async getInteractions(lessonId: string) {
    return this.prisma.videoInteraction.findMany({
      where: { videoLessonId: lessonId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async removeInteraction(interactionId: string) {
    return this.prisma.videoInteraction.delete({
      where: { id: interactionId },
    });
  }

  async recordView(
    lessonId: string,
    userId: string,
    duration: number,
    completed: boolean,
  ) {
    const view = await this.prisma.videoView.create({
      data: {
        videoLessonId: lessonId,
        userId,
        duration,
        completed,
      },
    });

    // Award XP for completed lessons
    if (completed) {
      await this.prisma.xPReward.create({
        data: {
          userId,
          amount: 10,
          source: XPSource.LESSON_COMPLETED,
          sourceId: lessonId,
        },
      });
    }

    return view;
  }
}
