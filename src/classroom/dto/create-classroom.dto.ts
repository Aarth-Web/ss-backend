import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsArray,
} from 'class-validator';

export class CreateClassroomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  teacherId: string;

  @IsMongoId()
  @IsNotEmpty()
  schoolId: string;
}
