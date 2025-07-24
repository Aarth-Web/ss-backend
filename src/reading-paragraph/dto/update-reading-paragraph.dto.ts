import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { DifficultyLevel } from '../reading-paragraph.schema';

export class UpdateReadingParagraphDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficultyLevel?: DifficultyLevel;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedReadingTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}
