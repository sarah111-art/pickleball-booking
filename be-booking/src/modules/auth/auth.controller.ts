import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @Post('register')
  register(@Body() body: any) {
    // expects { email, password, fullname, phone }
    return this.authService.register({
      email: body.email,
      password: body.password,
      fullName: body.fullname ?? body.fullName,
      phone: body.phone,
    });
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @Post('google-login')
  googleLogin(@Body() body: any) {
    return this.authService.googleLogin(body.idToken);
  }

  @Post('refresh-token')
  refresh(@Body() body: any) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('forgot-password')
  forgot(@Body() body: any) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  reset(@Body() body: any) {
    return this.authService.resetPassword(body.resetToken, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@Req() req: Request) {
    const user = await this.usersService.findOne((req as any).user.id);
    const { password: _password, refreshToken: _refreshToken, resetToken: _resetToken, ...safeUser } = user as any;
    return safeUser;
  }
}
