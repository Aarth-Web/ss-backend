import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../user/user-role.enum';
import { ParentLanguage } from '../../user/parent-language.enum';

export class OnboardUserDto {
  @IsString()
  name: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsMongoId()
  schoolId?: string;

  @IsOptional()
  @IsString()
  secret?: string;

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
