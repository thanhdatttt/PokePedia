import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";
import { strongPasswordOptions } from "../../common/constants/auth.constant";

export class ResetPassDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;
  
  @IsString()
  @IsStrongPassword(strongPasswordOptions)
  newPassword!: string;
}