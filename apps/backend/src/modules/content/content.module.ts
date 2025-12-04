import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { AIClientService } from './ai-client.service';

@Module({
  imports: [HttpModule],
  controllers: [ContentController],
  providers: [ContentService, AIClientService],
  exports: [ContentService, AIClientService],
})
export class ContentModule {}
