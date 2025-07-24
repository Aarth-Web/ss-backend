import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  IsMongoId,
  Min,
  Max,
} from 'class-validator';
import { DifficultyLevel } from '../reading-paragraph.schema';

export class CreateReadingParagraphDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(DifficultyLevel)
  difficultyLevel: DifficultyLevel;

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
