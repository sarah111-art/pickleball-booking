import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private svc: SettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  get() {
    return this.svc.get();
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  update(@Body() body: any) {
    return this.svc.update(body);
  }
}
