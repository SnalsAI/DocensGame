import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { GameType } from '@prisma/client';

export class CreateGameDto {
  @ApiProperty({ enum: GameType })
  @IsEnum(GameType)
  gameType: GameType;

  @ApiProperty({ description: 'ID della classe' })
  @IsString()
  classroomId: string;

  @ApiPropertyOptional({ description: 'ID del contenuto per generare domande' })
  @IsOptional()
  @IsString()
  contentId?: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(50)
  numQuestions?: number;

  @ApiPropertyOptional({ default: 20, description: 'Secondi per domanda' })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(120)
  timePerQuestion?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showLeaderboard?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowLateJoin?: boolean;

  @ApiPropertyOptional({ default: 50, description: 'Percentuale tempo extra per DSA' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  dsaExtraTime?: number;
}
