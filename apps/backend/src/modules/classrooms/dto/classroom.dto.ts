import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateClassroomDto {
  @ApiProperty({ example: 'Classe 3A - Italiano' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Classe di italiano per la 3A' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2024/2025' })
  @IsOptional()
  @IsString()
  schoolYear?: string;

  @ApiPropertyOptional({ example: 'Italiano' })
  @IsOptional()
  @IsString()
  subject?: string;
}

export class UpdateClassroomDto {
  @ApiPropertyOptional({ example: 'Classe 3A - Italiano Avanzato' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class JoinClassroomDto {
  @ApiProperty({ example: 'ABC123XY', description: 'Codice della classe' })
  @IsString()
  code: string;
}
