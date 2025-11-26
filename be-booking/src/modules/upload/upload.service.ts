import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

const cfg = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

cloudinary.config(cfg);

@Injectable()
export class UploadService {
  async uploadBase64(data: string) {
    try {
      const res = await cloudinary.uploader.upload(data);
      return { url: res.secure_url, public_id: res.public_id };
    } catch (err) {
      throw new InternalServerErrorException('upload failed');
    }
  }
}
