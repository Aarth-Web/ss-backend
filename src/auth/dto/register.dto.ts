// auth/dto/register.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  role: 'superadmin' | 'schooladmin' | 'teacher' | 'student';

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  createdByRole?: string; // optional: to validate permissions

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsOptional()
  password?: string;
}
