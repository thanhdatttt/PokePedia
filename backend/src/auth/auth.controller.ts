import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, TokenPair } from './auth.service';
import { SendOtpDto } from './dto/sendOtp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpDto } from './dto/otp.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { ResetPassDto } from './dto/resetPass.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Registration flow:
 *   1. POST /api/auth/send-otp     { email, type: 'REGISTER' }
 *   2. POST /api/auth/verify-otp   { email, otp, type: 'REGISTER' }
 *   3. POST /api/auth/register     { username, email, password }
 *
 * Password reset flow:
 *   1. POST /api/auth/send-otp     { email, type: 'RESET' }
 *   2. POST /api/auth/verify-otp   { email, otp, type: 'RESET' }
 *   3. POST /api/auth/reset-password { email, newPassword }
 *
 * Session management:
 *   POST /api/auth/login           { email, password }
 *   POST /api/auth/refresh         { refreshToken }
 *   POST /api/auth/logout  🔒      { refreshToken }
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // registration flow
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: OtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // login flow
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<TokenPair> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPair> {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }

  // reset password flow
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPassDto) {
    return this.authService.resetPassword(dto);
  }
}