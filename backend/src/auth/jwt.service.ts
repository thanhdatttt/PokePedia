import { Injectable } from "@nestjs/common";
import { JwtService as NestJwtService, JwtSignOptions } from "@nestjs/jwt";
import config from "src/config/config";
import { AUTH_CONSTANTS } from "./constants/auth.constant";

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  generateAccessToken(payload: object): string {
    const options: JwtSignOptions = {
      secret: config().JWT_ACCESS_SECRET,
      expiresIn: AUTH_CONSTANTS.JWT_ACCESS_EXPIRES as JwtSignOptions["expiresIn"],
    };
    return this.jwtService.sign(payload, options);
  }

  generateRefreshToken(payload: object): string {
    const options: JwtSignOptions = {
      secret: config().JWT_REFRESH_SECRET,
      expiresIn: AUTH_CONSTANTS.JWT_REFRESH_EXPIRES as JwtSignOptions["expiresIn"],
    };
    return this.jwtService.sign(payload, options);
  }
}
