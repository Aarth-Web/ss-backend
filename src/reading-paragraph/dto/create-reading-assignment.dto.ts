import {
  IsEnum,
  IsMongoId,
  IsDateString,
  IsOptional,
  IsString,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { AssignmentType } from '../reading-assignment.schema';

export class CreateReadingAssignmentDto {
  @IsMongoId()
  paragraphId: string;

  @IsEnum(AssignmentType)
  type: AssignmentType;

  @ValidateIf((o) => o.type === AssignmentType.INDIVIDUAL)
  @IsArray()
  @IsMongoId({ each: true })
  studentIds?: string[];

  @ValidateIf((o) => o.type === AssignmentType.CLASSROOM)
  @IsMongoId()
  classroomId?: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}
