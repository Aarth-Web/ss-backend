import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  registrationId: string;

  @IsString()
  password: string;
}
