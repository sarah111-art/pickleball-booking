import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(@InjectRepository(Location) private repo: Repository<Location>) {}

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

  async update(id: string, payload: Partial<Location>) {
    await this.repo.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: string) {
    const e = await this.findOne(id);
    return this.repo.remove(e);
  }
}
