import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AttendanceRecordDto {
  @IsMongoId()
  student: string;

  @IsBoolean()
  present: boolean;
}

export class UpdateAttendanceDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records?: AttendanceRecordDto[];

  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  sendSmsTo?: string[];

  @IsBoolean()
  @IsOptional()
  sendSmsToAllAbsent?: boolean;
}
