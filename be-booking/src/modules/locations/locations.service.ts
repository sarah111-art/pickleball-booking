import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../entities/location.entity';
import { Court } from '../../entities/court.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private repo: Repository<Location>,
    @InjectRepository(Court) private courtRepo: Repository<Court>,
  ) {}

  create(payload: Partial<Location>) {
    const ent = this.repo.create(payload);
    return this.repo.save(ent);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Location not found');
    return e;
  }

  async findCourtsByLocation(locationId: string) {
    return this.courtRepo.find({
      where: { locationId, isActive: true },
      order: { courtName: 'ASC' }
    });
  }

  async update(id: string, payload: Partial<Location>) {
    await this.repo.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: string) {
    const e = await this.findOne(id);
    return this.repo.remove(e);
  }
}
