import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadBase64(data: string) {
    try {
      const res = await cloudinary.uploader.upload(data);
      return { url: res.secure_url, public_id: res.public_id };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'upload failed';
      throw new InternalServerErrorException(message);
    }
  }
}
