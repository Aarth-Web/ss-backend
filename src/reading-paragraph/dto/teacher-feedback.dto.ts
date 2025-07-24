import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class TeacherFeedbackDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  teacherRating?: number;

  @IsOptional()
  @IsString()
  teacherFeedback?: string;
}
