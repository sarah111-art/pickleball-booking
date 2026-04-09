import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Racket } from '../../entities/racket.entity';

@Injectable()
export class RacketsService {
  constructor(@InjectRepository(Racket) private repo: Repository<Racket>) {}

  async create(payload: Partial<Racket>) {
    const e = this.repo.create(payload);
    return this.repo.save(e);
  }

  findAll(query?: Record<string, any>) {
    const qb = this.repo.createQueryBuilder('racket');

    if (query?.type) qb.andWhere('racket.type = :type', { type: query.type });
    if (query?.isActive !== undefined) qb.andWhere('racket.isActive = :active', { active: Boolean(query.isActive) });
    if (query?.search) qb.andWhere('racket.name LIKE :search', { search: `%${query.search}%` });

    return qb.orderBy('racket.createdAt', 'DESC').getMany();
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Racket not found');
    return e;
  }

  async update(id: string, payload: Partial<Racket>) {
    const e = await this.findOne(id);
    Object.assign(e, payload);
    return this.repo.save(e);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
