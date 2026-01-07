import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: (this.configService.get('SMTP_PORT'), 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const from = this.configService.get('MAIL_FROM') || this.configService.get('SMTP_USER');
    await this.transporter.sendMail({ from, to, subject, html });
  }

  async sendActivationCode(email: string, code: string): Promise<void> {
    const subject = 'Activate Your Account';
    const html = `
      <h2>Welcome!</h2>
      <p>Please activate your account by clicking the link below:</p>
      <p><a href="${this.getActivationLink(code)}">Activate Account</a></p>
      <p>Or enter this code manually: <strong>${code}</strong></p>
    `;
    await this.sendMail(email, subject, html);
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const subject = 'Reset Your Password';
    const html = `
      <h2>Password Reset Request</h2>
      <p>Use the code below to reset your password:</p>
      <h3>${code}</h3>
      <p>This code expires in 1 hour.</p>
    `;
    await this.sendMail(email, subject, html);
  }

  async sendAccountActivatedNotification(email: string): Promise<void> {
    const subject = 'Account Activated';
    const html = `
      <h2>Your Account Has Been Activated</h2>
      <p>Your account has been successfully activated by an administrator.</p>
      <p>You can now log in to your account.</p>
    `;
    await this.sendMail(email, subject, html);
  }

  private getActivationLink(code: string): string {
    // Adjust frontend URL as needed
    return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate?code=${code}`;
  }
}