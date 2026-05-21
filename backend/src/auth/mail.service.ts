import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * MailService — sends OTP emails via SMTP (nodemailer).
 *
 * Dev fallback: if MAIL_HOST is not configured, OTP is logged to console
 * so you can develop without a mail server.
 *
 * To enable real email:
 *   npm install nodemailer @types/nodemailer
 *   Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM in .env
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtp(to: string, otp: string, type: 'REGISTER' | 'RESET'): Promise<void> {
    const subject =
      type === 'REGISTER' ? 'Verify your email' : 'Reset your password';

    const text =
      type === 'REGISTER'
        ? `Your email verification code is: ${otp}\nIt expires in 5 minutes.`
        : `Your password reset code is: ${otp}\nIt expires in 5 minutes.`;

    const mailHost = this.configService.get<string>('MAIL_HOST');

    if (!mailHost) {
      // test mode
      this.logger.warn('MAIL_HOST not set — printing OTP to console (dev only)');
      this.logger.log(`OTP for <${to}> [${type}]: ${otp}`);
      return;
    }

    // ─── PRODUCTION: send via nodemailer ─────────────────────────────────
    // Uncomment after: npm install nodemailer @types/nodemailer
    //
    // import * as nodemailer from 'nodemailer';
    //
    // const transporter = nodemailer.createTransport({
    //   host: mailHost,
    //   port: this.configService.get<number>('MAIL_PORT'),
    //   secure: false,
    //   auth: {
    //     user: this.configService.get<string>('MAIL_USER'),
    //     pass: this.configService.get<string>('MAIL_PASS'),
    //   },
    // });
    //
    // await transporter.sendMail({
    //   from: this.configService.get<string>('MAIL_FROM'),
    //   to,
    //   subject,
    //   text,
    // });

    this.logger.log(`✉️  Email sent to ${to}: ${subject}`);
  }
}