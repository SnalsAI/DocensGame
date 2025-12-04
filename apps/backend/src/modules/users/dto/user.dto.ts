import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Mario' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Rossi' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateStudentProfileDto {
  @ApiPropertyOptional({ description: 'Flag DSA (Disturbi Specifici Apprendimento)' })
  @IsOptional()
  @IsBoolean()
  isDsa?: boolean;

  @ApiPropertyOptional({ description: 'Tipo DSA', example: 'dislessia' })
  @IsOptional()
  @IsString()
  dsaType?: string;

  @ApiPropertyOptional({ description: 'Flag BES (Bisogni Educativi Speciali)' })
  @IsOptional()
  @IsBoolean()
  isBes?: boolean;

  @ApiPropertyOptional({ description: 'Descrizione BES' })
  @IsOptional()
  @IsString()
  besDescription?: string;

  @ApiPropertyOptional({ description: 'Flag L2 (Italiano come seconda lingua)' })
  @IsOptional()
  @IsBoolean()
  isL2?: boolean;

  @ApiPropertyOptional({ description: 'Livello L2', example: 'A2' })
  @IsOptional()
  @IsString()
  l2Level?: string;

  @ApiPropertyOptional({ description: 'Dimensione font preferita' })
  @IsOptional()
  @IsString()
  preferredFontSize?: string;

  @ApiPropertyOptional({ description: 'Alto contrasto' })
  @IsOptional()
  @IsBoolean()
  highContrast?: boolean;

  @ApiPropertyOptional({ description: 'Audio abilitato' })
  @IsOptional()
  @IsBoolean()
  audioEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Tempo extra per giochi (%)', example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  extraTime?: number;
}
