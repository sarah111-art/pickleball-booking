import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RacketRental } from '../../entities/racket-rental.entity';

@Injectable()
export class RacketRentalsService {
  constructor(@InjectRepository(RacketRental) private repo: Repository<RacketRental>) {}

  async create(payload: Partial<RacketRental>) {
    const e = this.repo.create(payload);
    return this.repo.save(e);
  }

  findAll(query?: Record<string, any>) {
    const qb = this.repo.createQueryBuilder('rental')
      .leftJoinAndSelect('rental.racket', 'racket');

    if (query?.racketId) qb.andWhere('rental.racketId = :racketId', { racketId: query.racketId });
    if (query?.isActive !== undefined) qb.andWhere('rental.isActive = :active', { active: Boolean(query.isActive) });

    return qb.orderBy('rental.createdAt', 'DESC').getMany();
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id }, relations: ['racket'] });
    if (!e) throw new NotFoundException('Racket rental not found');
    return e;
  }

  async update(id: string, payload: Partial<RacketRental>) {
    const e = await this.findOne(id);
    Object.assign(e, payload);
    return this.repo.save(e);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
