import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  private getGoogleClient() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Google login is not configured');
    }
    return { client: new OAuth2Client(clientId), clientId };
  }

  private async sendResetEmail(email: string, resetLink: string) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const fromEmail = this.configService.get<string>('MAIL_FROM') ?? smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
      this.logger.warn('SMTP is not fully configured, skip sending reset email');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'Yeu cau dat lai mat khau',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
          <h2>Dat lai mat khau</h2>
          <p>Ban vua yeu cau dat lai mat khau cho tai khoan Pickleball Booking.</p>
          <p>Nhan vao lien ket ben duoi de dat lai mat khau (hieu luc 30 phut):</p>
          <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
          <p>Neu ban khong thuc hien yeu cau nay, vui long bo qua email.</p>
        </div>
      `,
    });
  }

  async register(payload: { email: string; password: string; fullName?: string; phone?: string }) {
    const existing = await this.usersService.findByEmail(payload.email);
    if (existing) throw new UnauthorizedException('Email already registered');

    const hashed = await bcrypt.hash(payload.password, 10);
    const user = await this.usersService.create({
      email: payload.email,
      password: hashed,
      fullName: payload.fullName,
      phone: payload.phone,
    });

    // sign access token
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { user, accessToken };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    // remove password from returned object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...rest } = user as any;
    return rest;
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);
    // create a simple refresh token (in a real app use secure random token & DB storage)
    const refreshToken = await bcrypt.hash(`${user.email}:${Date.now()}`, 4);
    await this.usersService.update(user.id, { refreshToken });
    return { accessToken, refreshToken };
  }

  async googleLogin(idToken: string) {
    if (!idToken) throw new UnauthorizedException('Missing Google token');

    const { client, clientId } = this.getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const emailVerified = payload?.email_verified;
    const fullName = payload?.name;

    if (!email || !emailVerified) {
      throw new UnauthorizedException('Google account is not verified');
    }

    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({
        email,
        fullName,
        role: 'user',
      });
    }

    const authPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(authPayload);
    const refreshToken = await bcrypt.hash(`${user.email}:${Date.now()}`, 4);
    await this.usersService.update(user.id, { refreshToken });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    // find user with refreshToken
    // in this naive implementation we match the hashed token string in DB
    const users = await this.usersService.findAll();
    const user = users.find((u) => u.refreshToken === refreshToken);
    if (!user) throw new UnauthorizedException('Invalid refresh token');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: this.jwt.sign(payload) };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.log(`Forgot password requested for non-existent email: ${email}`);
      return { ok: true };
    }

    const token = this.jwt.sign(
      { sub: user.id, type: 'password_reset' },
      { expiresIn: '30m' },
    );

    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173').replace(/\/$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.usersService.update(user.id, { resetToken: token });
    // Do not block API response on SMTP latency/timeouts.
    void this.sendResetEmail(user.email, resetLink)
      .then(() => {
        this.logger.log(`Reset password email queued for: ${user.email}`);
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to send reset password email for ${user.email}`,
          err instanceof Error ? err.stack : String(err),
        );
      });

    return { ok: true };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    if (!resetToken) throw new UnauthorizedException('Missing reset token');
    if (!newPassword || newPassword.length < 6) {
      throw new UnauthorizedException('Password must be at least 6 characters');
    }

    let decoded: { sub: string; type?: string };
    try {
      decoded = this.jwt.verify(resetToken) as { sub: string; type?: string };
    } catch {
      throw new UnauthorizedException('Reset token expired or invalid');
    }

    if (decoded.type !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset token');
    }

    const user = await this.usersService.findOne(decoded.sub);
    if (!user.resetToken || user.resetToken !== resetToken) {
      throw new UnauthorizedException('Reset token expired or invalid');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user.id, { password: hashed, resetToken: undefined });
    return { ok: true };
  }
}
