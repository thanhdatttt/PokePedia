import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

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

    // production mode
    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
    
    await transporter.sendMail({
      from: {
        name: 'PokePedia',
        address: this.configService.get<string>('MAIL_FROM') || 'noreply@pokepoedia.com',
      },
      to,
      subject,
      text,
    });

    this.logger.log(`Email sent to ${to}: ${subject}`);
  }
}