import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwt: JwtService) {}

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
    if (!user) return { ok: true };
    // create a simple token and store it
    const token = (await bcrypt.hash(`${user.email}:${Date.now()}`, 6)).replace(/\//g, '');
    await this.usersService.update(user.id, { resetToken: token });
    // in real app send email to user with reset link
    return { ok: true, resetToken: token };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    const users = await this.usersService.findAll();
    const user = users.find((u) => u.resetToken === resetToken);
    if (!user) throw new UnauthorizedException('Invalid reset token');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user.id, { password: hashed, resetToken: undefined });
    return { ok: true };
  }
}
