import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue } from '../../entities/venue.entity';
import { Court } from '../../entities/court.entity';

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue) private repo: Repository<Venue>,
    @InjectRepository(Court) private courtRepo: Repository<Court>,
  ) {}

  create(payload: Partial<Venue>) {
    const ent = this.repo.create(payload);
    return this.repo.save(ent);
  }

  findAll() {
    return this.repo.find({ relations: ['location'] });
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id }, relations: ['location'] });
    if (!e) throw new NotFoundException('Venue not found');
    return e;
  }

  async findCourtsByVenue(venueId: string) {
    return this.courtRepo.find({ 
      where: { venueId, isActive: true },
      order: { courtName: 'ASC' }
    });
  }

  async update(id: string, payload: Partial<Venue>) {
    await this.repo.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: string) {
    const e = await this.findOne(id);
    return this.repo.remove(e);
  }
}

