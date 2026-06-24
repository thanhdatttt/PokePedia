import { Injectable, BadRequestException, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService } from 'src/database/database.service';
import { RedisService } from 'src/redis/redis.service';
import { JwtService } from './jwt.service';
import { MailService } from './mail.service';
import { HashUtil } from '../common/utils/hash.util';
import { OtpUtil } from '../common/utils/otp.util';
import { AUTH_CONSTANTS } from '../common/constants/auth.constant';
import { users, refreshTokens } from 'src/database/schema/auth.schema';

import { SendOtpDto } from './dtos/sendOtp.dto';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { OtpDto } from './dtos/otp.dto';
import { RefreshTokenDto } from './dtos/refreshToken.dto';
import { ResetPassDto } from './dtos/resetPass.dto';

// Redis keys
const key = {
  otp:           (type: string, email: string) => `otp:${type}:${email}`,
  emailVerified: (email: string) => `email_verified:${email}`,
  resetVerified: (email: string) => `reset_verified:${email}`,
};

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // send otp
  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    if (dto.type === 'REGISTER') {
      // check if email is already registered
      const [existing] = await this.db.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, dto.email))
        .limit(1);

      if (existing) {
        throw new ConflictException('Email already registered');
      }

      await this.generateAndSendOtp(dto.email, 'REGISTER');
      return { message: 'Verification code sent. Check your email.' };
    }

    if (dto.type === 'RESET') {
      const [user] = await this.db.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, dto.email))
        .limit(1);

      if (user) {
        await this.generateAndSendOtp(dto.email, 'RESET');
      }

      return { message: 'If that email is registered, a reset code has been sent.' };
    }

    throw new BadRequestException('Unknown OTP type');
  }

  // verify otp
  async verifyOtp(dto: OtpDto): Promise<{ message: string }> {
    const otpKey = key.otp(dto.type, dto.email);
    const storedOtp = await this.redis.getOtp(otpKey);

    if (!storedOtp) {
      throw new BadRequestException('OTP expired or not found. Please request a new one.');
    }

    if (storedOtp !== dto.otp) {
      throw new BadRequestException('Invalid OTP.');
    }

    // Consume OTP — one-time use
    await this.redis.deleteKey(otpKey);

    if (dto.type === 'REGISTER') {
      // Store a flag that allows completing registration (not tied to a DB row yet)
      await this.redis.setOtp(key.emailVerified(dto.email), '1', AUTH_CONSTANTS.EMAIL_VERIFIED_TTL);
      return { message: 'Email verified. You have 15 minutes to complete registration.' };
    }

    if (dto.type === 'RESET') {
      await this.redis.setOtp(key.resetVerified(dto.email), '1', AUTH_CONSTANTS.RESET_VERIFIED_TTL);
      return { message: 'OTP verified. You have 10 minutes to reset your password.' };
    }

    throw new BadRequestException('Unknown OTP type');
  }

  // register
  async register(dto: RegisterDto): Promise<{ message: string }> {
    // 1. Gate: email must have been verified in this session
    const verifiedFlag = await this.redis.getOtp(key.emailVerified(dto.email));
    if (!verifiedFlag) {
      throw new BadRequestException(
        'Email not verified. Please verify your email before registering.',
      );
    }

    // 2. Race-condition guard: double-check email is still free
    const [existing] = await this.db.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existing) {
      await this.redis.deleteKey(key.emailVerified(dto.email));
      throw new ConflictException('Email already registered');
    }

    // 3. Check username uniqueness
    const [takenUsername] = await this.db.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, dto.username))
      .limit(1);

    if (takenUsername) {
      throw new ConflictException('Username already taken');
    }

    // 4. Create the account — email is already verified, so isVerified: true
    const passwordHash = await HashUtil.hashPassword(dto.password);

    await this.db.db.insert(users).values({
      username: dto.username,
      email: dto.email,
      passwordHash,
    });

    // 5. Clean up the Redis flag
    await this.redis.deleteKey(key.emailVerified(dto.email));

    return { message: 'Account created successfully. You can now log in.' };
  }

  // login
  async login(dto: LoginDto): Promise<TokenPair> {
    const [user] = await this.db.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await HashUtil.comparePassword(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokenPair(user.id, user.email);
  }

  // refresh and rotate
  async refresh(dto: RefreshTokenDto): Promise<TokenPair> {
    const payload = this.jwtService.verifyRefreshToken(dto.refreshToken);

    const storedTokens = await this.db.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, payload.sub));

    let matchedToken: typeof storedTokens[0] | undefined;
    for (const record of storedTokens) {
      const match = await HashUtil.comparePassword(dto.refreshToken, record.tokenHash);
      if (match) { matchedToken = record; break; }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token not recognised — please log in again');
    }

    if (matchedToken.expiresAt < new Date()) {
      await this.db.db.delete(refreshTokens).where(eq(refreshTokens.id, matchedToken.id));
      throw new UnauthorizedException('Refresh token expired — please log in again');
    }

    await this.db.db.delete(refreshTokens).where(eq(refreshTokens.id, matchedToken.id));
    return this.generateTokenPair(payload.sub, payload.email);
  }

  // logout
  async logout(dto: RefreshTokenDto): Promise<{ message: string }> {
    let userId: string;
    try {
      const payload = this.jwtService.verifyRefreshToken(dto.refreshToken);
      userId = payload.sub;
    } catch {
      return { message: 'Logged out successfully' };
    }

    const storedTokens = await this.db.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    for (const record of storedTokens) {
      const match = await HashUtil.comparePassword(dto.refreshToken, record.tokenHash);
      if (match) {
        await this.db.db.delete(refreshTokens).where(eq(refreshTokens.id, record.id));
        break;
      }
    }

    return { message: 'Logged out successfully' };
  }

  // reset pass
  async resetPassword(dto: ResetPassDto): Promise<{ message: string }> {
    const isVerified = await this.redis.getOtp(key.resetVerified(dto.email));
    if (!isVerified) {
      throw new BadRequestException('Not authorised. Please verify your OTP first.');
    }

    const [user] = await this.db.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user) throw new NotFoundException('User not found');

    const newHash = await HashUtil.hashPassword(dto.newPassword);
    await this.db.db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Invalidate all sessions after password change
    await this.db.db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await this.redis.deleteKey(key.resetVerified(dto.email));

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  // private helpers  
  private async generateAndSendOtp(email: string, type: 'REGISTER' | 'RESET'): Promise<void> {
    const otp = OtpUtil.generateOtp();
    await this.redis.setOtp(key.otp(type, email), otp, AUTH_CONSTANTS.OTP_TTL);
    await this.mailService.sendOtp(email, otp, type);
  }

  private async generateTokenPair(userId: string, email: string): Promise<TokenPair> {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    const tokenHash = await HashUtil.hashPassword(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.db.db.insert(refreshTokens).values({ userId, tokenHash, expiresAt });

    return { accessToken, refreshToken };
  }
}