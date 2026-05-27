import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService, JwtSignOptions } from '@nestjs/jwt';
import { AUTH_CONSTANTS } from '../common/constants/auth.constant';

export interface JwtPayload {
  sub: string;    // userId
  email: string;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    const options: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: AUTH_CONSTANTS.JWT_ACCESS_EXPIRES as JwtSignOptions['expiresIn'],
    };
    return this.jwtService.sign(payload, options);
  }

  generateRefreshToken(payload: JwtPayload): string {
    const options: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: AUTH_CONSTANTS.JWT_REFRESH_EXPIRES as JwtSignOptions['expiresIn'],
    };
    return this.jwtService.sign(payload, options);
  }

  // verify and decode a refresh token
  verifyRefreshToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}