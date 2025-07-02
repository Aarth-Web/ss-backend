import { IsString, IsIn, IsMongoId } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  name: string;

  @IsIn(['schooladmin', 'teacher', 'student'])
  role: string;

  @IsMongoId()
  schoolId: string;
}
