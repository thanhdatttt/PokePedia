import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MinLength } from "class-validator";
import { strongPasswordOptions } from "../../common/constants/auth.constant";

export class RegisterDto {
  @IsString()
  @MinLength(5)
  username!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsString()
  @IsStrongPassword(strongPasswordOptions)
  password!: string;
}