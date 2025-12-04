import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { VideoClientService } from './video-client.service';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [HttpModule, ContentModule],
  controllers: [LessonsController],
  providers: [LessonsService, VideoClientService],
  exports: [LessonsService],
})
export class LessonsModule {}
