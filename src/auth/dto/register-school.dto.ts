import { IsString } from 'class-validator';

export class RegisterSchoolDto {
  @IsString()
  name: string;

  @IsString()
  address: string;
}
