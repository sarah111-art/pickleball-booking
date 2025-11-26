import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('upload')
export class UploadController {
  constructor(private svc: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @Post('image')
  async image(@Body() body: any) {
    // Accepts { data: '<base64-data-or-url>' }
    return this.svc.uploadBase64(body.data);
  }
}
