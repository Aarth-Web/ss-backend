import { IsArray, IsNotEmpty, IsMongoId } from 'class-validator';

export class AddStudentsDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  studentIds: string[];
}
