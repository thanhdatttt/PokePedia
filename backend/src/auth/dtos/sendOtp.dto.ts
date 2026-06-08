import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

enum OtpType {
  REGISTER = 'REGISTER',
  RESET = 'RESET',
}

export class SendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsEnum(OtpType)
  @IsNotEmpty()
  type!: OtpType;
}