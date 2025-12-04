import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ContentType, QuizType } from '@prisma/client';

export class CreateContentDto {
  @ApiProperty({ example: 'La Rivoluzione Francese' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Lezione sulla Rivoluzione Francese' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ContentType })
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classroomId?: string;

  @ApiPropertyOptional({ description: 'Contenuto testuale grezzo' })
  @IsOptional()
  @IsString()
  rawContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class GenerateQuizDto {
  @ApiPropertyOptional({ example: 'Quiz sulla Rivoluzione Francese' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: QuizType, default: QuizType.MULTIPLE_CHOICE })
  @IsEnum(QuizType)
  type: QuizType;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  numQuestions?: number;

  @ApiPropertyOptional({ description: 'Tempo limite in secondi' })
  @IsOptional()
  @IsInt()
  @Min(30)
  timeLimit?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showFeedback?: boolean;
}
