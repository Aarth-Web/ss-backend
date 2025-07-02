import { IsDateString, IsMongoId, IsOptional } from 'class-validator';

export class GetAttendanceDto {
  @IsMongoId()
  @IsOptional()
  classroomId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsMongoId()
  @IsOptional()
  studentId?: string;
}
