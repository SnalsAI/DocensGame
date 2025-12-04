import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { InteractionType } from '@prisma/client';

export class CreateLessonDto {
  @ApiProperty({ description: 'ID del contenuto da cui generare la lezione' })
  @IsString()
  contentId: string;

  @ApiPropertyOptional({ example: 'Lezione sulla Rivoluzione Francese' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'ID dell\'avatar da usare' })
  @IsOptional()
  @IsString()
  avatarId?: string;

  @ApiPropertyOptional({ description: 'ID della voce TTS da usare' })
  @IsOptional()
  @IsString()
  voiceId?: string;
}

export class AddInteractionDto {
  @ApiProperty({ enum: InteractionType })
  @IsEnum(InteractionType)
  type: InteractionType;

  @ApiProperty({ description: 'Timestamp in secondi', example: 30 })
  @IsInt()
  @Min(0)
  timestamp: number;

  @ApiProperty({ description: 'Dati dell\'interazione (quiz, nota, etc)' })
  data: Record<string, unknown>;
}
