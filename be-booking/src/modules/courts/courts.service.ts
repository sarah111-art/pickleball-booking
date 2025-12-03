import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Court } from '../../entities/court.entity';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CourtsService {
  constructor(@InjectRepository(Court) private repo: Repository<Court>, private uploadSvc?: UploadService) {}

  async create(payload: Partial<Court>) {
    // if images provided upload to Cloudinary (payload.images can be array of base64/data or external URLs)
    if (payload.images && Array.isArray(payload.images) && this.uploadSvc) {
      const out: string[] = [];
      for (const img of payload.images) {
        if (typeof img === 'string' && img.includes('res.cloudinary.com')) {
          out.push(img);
        } else if (typeof img === 'string') {
          const res = await this.uploadSvc.uploadBase64(img);
          out.push(res.url);
        }
      }
      payload.images = out as any;
    }

    const e = this.repo.create(payload);
    return this.repo.save(e);
  }

  findAll(query?: Record<string, any>) {
    const qb = this.repo.createQueryBuilder('court')
      .leftJoinAndSelect('court.venue', 'venue');

    if (query?.venueId) qb.andWhere('court.venueId = :venueId', { venueId: query.venueId });
    if (query?.minPrice) qb.andWhere('court.pricePerHour >= :min', { min: query.minPrice });
    if (query?.maxPrice) qb.andWhere('court.pricePerHour <= :max', { max: query.maxPrice });
    if (query?.isActive !== undefined) qb.andWhere('court.isActive = :active', { active: Boolean(query.isActive) });

    return qb.getMany();
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id }, relations: ['venue'] });
    if (!e) throw new NotFoundException('Court not found');
    return e;
  }

  async update(id: string, payload: Partial<Court>) {
    if (payload.images && Array.isArray(payload.images) && this.uploadSvc) {
      const out: string[] = [];
      for (const img of payload.images) {
        if (typeof img === 'string' && img.includes('res.cloudinary.com')) {
          out.push(img);
        } else if (typeof img === 'string') {
          const res = await this.uploadSvc.uploadBase64(img);
          out.push(res.url);
        }
      }
      payload.images = out as any;
    }

    await this.repo.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: string) {
    const e = await this.findOne(id);
    return this.repo.remove(e);
  }
}
