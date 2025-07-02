import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class UpdateClassroomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsOptional()
  teacherId?: string;
}
