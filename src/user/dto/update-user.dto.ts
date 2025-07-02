import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../user-role.enum';
import { ParentLanguage } from '../parent-language.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  school?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  mobile?: string;

  @IsOptional()
  additionalInfo?: Record<string, any>;

  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsOptional()
  @IsEnum(ParentLanguage)
  parentLanguage?: ParentLanguage;

  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsOptional()
  @IsString()
  parentOccupation?: string;
}
