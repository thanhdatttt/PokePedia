import { IsEmail,IsEnum,IsNotEmpty, IsString } from "class-validator";

enum OtpType {
  RESET = 'RESET',
  REGISTER = 'REGISTER',
}

export class OtpDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;

  @IsEnum(OtpType)
  @IsNotEmpty()
  type!: OtpType;
}