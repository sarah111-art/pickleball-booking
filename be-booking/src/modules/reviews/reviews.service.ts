import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(@InjectRepository(Review) private repo: Repository<Review>) {}

  create(payload: Partial<Review>) {
    const e = this.repo.create(payload);
    return this.repo.save(e);
  }

  findByCourt(courtId: number) {
    return this.repo.find({ where: { court: { id: courtId } }, relations: ['user'] });
  }
}
