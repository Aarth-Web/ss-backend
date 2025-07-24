import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class CompleteReadingAssignmentDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  selfRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readingDuration?: number; // in seconds
}
