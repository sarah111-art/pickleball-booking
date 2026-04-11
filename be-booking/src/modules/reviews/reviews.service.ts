import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(@InjectRepository(Review) private repo: Repository<Review>) {}

  async create(payload: { courtId: string; userId: string; rating: number; comment?: string }) {
    const review = this.repo.create({
      court: { id: payload.courtId } as any,
      user: payload.userId ? ({ id: payload.userId } as any) : null,
      rating: payload.rating,
      comment: payload.comment,
    });

    return this.repo.save(review);
  }

  findAll() {
    return this.repo.find({ relations: ['user', 'court'], order: { createdAt: 'DESC' } });
  }

  findByCourt(courtId: string) {
    return this.repo.find({ where: { court: { id: courtId } }, relations: ['user'] });
  }
}
