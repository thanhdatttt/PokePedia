import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailjet from 'node-mailjet';

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

    // Mailjet service to send mail
    const apiKey = this.configService.get<string>('MAILJET_API_KEY') ?? '';
    const secretKey = this.configService.get<string>('MAILJET_SECRET_KEY') ?? '';
    const fromEmail = this.configService.get<string>('MAIL_FROM_EMAIL') ?? 'noreply@pokepoedia.com';
    const fromName = this.configService.get<string>('MAIL_FROM_NAME') ?? 'PokePedia';
    const mailjet = new Mailjet({
      apiKey: apiKey,
      apiSecret: secretKey,
    })

     try {
      await mailjet
        .post('send', {
          version: 'v3.1',
        })
        .request({
          Messages: [
            {
              From: {
                Email: fromEmail,
                Name: fromName,
              },

              To: [
                {
                  Email: to,
                },
              ],

              Subject: subject,

              TextPart: text,

              HTMLPart: html,
            },
          ],
        });

      this.logger.log(
        `Email from ${fromEmail} sent to ${to}: ${subject} : OTP <${otp}>`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );

      throw error;
    }
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
          
          <div style="background: #da2b29; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">POKEPEDIA CENTER</h1>
          </div>

          <div style="padding: 32px;">
            <h2 style="margin-top: 0; color: #333; text-align: center;">
              ${title}
            </h2>

            <p style="color: #555; font-size: 16px; line-height: 1.6; text-align: center;">
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
                  color: #da2b29;
                "
              >
                ${otp}
              </div>
            </div>

            <p style="color: #777; font-size: 14px; text-align: center;">
              This OTP will expire in <strong>5 minutes</strong>.
            </p>

            <p style="color: #777; font-size: 14px; text-align: center;">
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