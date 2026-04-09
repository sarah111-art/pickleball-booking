import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeSlot } from '../../entities/timeslot.entity';
import { Court } from '../../entities/court.entity';

@Injectable()
export class TimeSlotsService {
  constructor(@InjectRepository(TimeSlot) private repo: Repository<TimeSlot>) {}

  async createForCourt(court: Court, date: string, slots: Array<{ start: string; end: string }>) {
    const created: TimeSlot[] = [];
    for (const s of slots) {
      const ent = this.repo.create({ court, date, start: s.start, end: s.end });
      created.push(await this.repo.save(ent));
    }
    return created;
  }

  findByCourtAndDate(courtId: string, date: string) {
    return this.repo.find({ where: { date, court: { id: courtId } }, relations: ['court'] });
  }

  async findByDate(date: string, venueId?: string) {
    const qb = this.repo.createQueryBuilder('slot')
      .leftJoinAndSelect('slot.court', 'court')
      .leftJoinAndSelect('court.venue', 'venue')
      .where('slot.date = :date', { date })
      .andWhere('slot.isBooked = :isBooked', { isBooked: false })
      .orderBy('slot.start', 'ASC');

    if (venueId) {
      qb.andWhere('court.venueId = :venueId', { venueId });
    }

    return qb.getMany();
  }

  findAll() {
    return this.repo.find({ relations: ['court'], order: { date: 'DESC', start: 'ASC' } });
  }

  async remove(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('TimeSlot not found');
    return this.repo.remove(e);
  }
}
