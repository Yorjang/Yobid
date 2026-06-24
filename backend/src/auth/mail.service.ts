import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ? Number(port) : 587,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('SMTP Mail transporter configured successfully.');
    } else {
      this.logger.warn('SMTP settings missing in .env. MailService is running in DEV / MOCK mode (OTP will be logged to Console).');
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@yorbid.com';
    const subject = 'Your Yorbid Verification Code';
    const text = `Your verification code is ${code}. It will expire in 5 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #7c3aed; text-align: center;">Yorbid Authentication</h2>
        <p>Hello,</p>
        <p>You recently initiated a login or registration via Google. Please use the following 6-digit code to complete the verification process:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #1f2937; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="text-align: center; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Yorbid. All rights reserved.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"Yorbid Security" <${fromEmail}>`,
          to: email,
          subject,
          text,
          html,
        });
        this.logger.log(`Verification code successfully sent to ${email} via SMTP.`);
        return true;
      } catch (error) {
        this.logger.error(`Failed to send verification email to ${email} via SMTP:`, error.stack);
        // Fallback to console logging if SMTP fails
      }
    }

    // Log to console in large formatted block so the developer can spot it instantly
    console.log('\n' + '='.repeat(60));
    console.log('📬 [MAIL SERVICE DEV MOCK] EMAIL SENT');
    console.log(`To:      ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Code:    ${code} (Expires in 5 minutes)`);
    console.log('='.repeat(60) + '\n');

    return true;
  }
}
