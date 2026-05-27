import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtp(to: string, otp: string, type: 'REGISTER' | 'RESET',): Promise<void> {
    const isRegister = type === 'REGISTER';
    const subject = isRegister ? 'Verify your email' : 'Reset your password';
    const text = isRegister
      ? `Your email verification code is: ${otp}\nIt expires in 5 minutes.`
      : `Your password reset code is: ${otp}\nIt expires in 5 minutes.`;
    const html = this.generateOtpTemplate({
      otp,
      title: isRegister ? 'Email Verification' : 'Password Reset',
      description: isRegister
        ? 'Use the following OTP code to verify your account.'
        : 'Use the following OTP code to reset your password.',
    });

    const mailHost = this.configService.get<string>('MAIL_HOST');
    if (!mailHost) {
      // test mode
      this.logger.warn(
        'MAIL_HOST not set — printing OTP to console (dev only)',
      );
      this.logger.log(`OTP for <${to}> [${type}]: ${otp}`);
      return;
    }

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
        address:
          this.configService.get<string>('MAIL_FROM') ||
          'noreply@pokepedia.com',
      },
      to,
      subject,
      text,
      html,
    });

    this.logger.log(`Email sent to ${to}: ${subject}`);
  }

  private generateOtpTemplate({
    otp,
    title,
    description,
  }: {
    otp: string;
    title: string;
    description: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 20px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <div style="background: #ef5350; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">POKEPEDIA CENTER</h1>
          </div>

          <div style="padding: 32px;">
            <h2 style="margin-top: 0; color: #333;">
              ${title}
            </h2>

            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              ${description}
            </p>

            <div style="margin: 32px 0; text-align: center;">
              <div
                style="
                  display: inline-block;
                  background: #f3f3f3;
                  padding: 16px 32px;
                  border-radius: 10px;
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 8px;
                  color: #ef5350;
                "
              >
                ${otp}
              </div>
            </div>

            <p style="color: #777; font-size: 14px;">
              This OTP will expire in <strong>5 minutes</strong>.
            </p>

            <p style="color: #777; font-size: 14px;">
              If you did not request this email, you can safely ignore it.
            </p>
          </div>

          <div style="background: #fafafa; padding: 16px; text-align: center; font-size: 12px; color: #999;">
            © 2026 PokePedia. All rights reserved.
          </div>
        </div>
      </div>
    `;
  }
}