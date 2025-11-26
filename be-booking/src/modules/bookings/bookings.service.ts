import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { TimeSlot } from '../../entities/timeslot.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private repo: Repository<Booking>,
    @InjectRepository(TimeSlot) private slots: Repository<TimeSlot>,
  ) {}

  async create(payload: { user: User; courtId: number; date: string; slotId: number; paymentMethod?: string; note?: string }) {
    const slot = await this.slots.findOne({ where: { id: payload.slotId } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.isBooked) throw new BadRequestException('Slot already booked');

    // mark slot booked
    slot.isBooked = true;
    await this.slots.save(slot);

    const booking = this.repo.create({
      user: payload.user,
      court: { id: payload.courtId } as any,
      slot,
      date: payload.date,
      paymentMethod: payload.paymentMethod,
      note: payload.note,
      status: 'pending',
      total: 0,
    });

    return this.repo.save(booking);
  }

  findByUser(userId: number) {
    return this.repo.find({ where: { user: { id: userId } }, relations: ['slot', 'court'] });
  }

  find(query?: { courtId?: number; date?: string }) {
    const qb = this.repo.createQueryBuilder('b').leftJoinAndSelect('b.slot', 'slot').leftJoinAndSelect('b.court', 'court');
    if (query?.courtId) qb.andWhere('court.id = :id', { id: Number(query.courtId) });
    if (query?.date) qb.andWhere('b.date = :date', { date: query.date });
    return qb.getMany();
  }

  async findOne(id: number) {
    const b = await this.repo.findOne({ where: { id }, relations: ['user', 'court', 'slot'] });
    if (!b) throw new NotFoundException('Booking not found');
    return b;
  }

  async cancel(id: number, requesterId?: number) {
    const b = await this.findOne(id);
    if (b.status === 'cancelled') return b;
    b.status = 'cancelled';
    await this.repo.save(b);

    // release slot
    const slot = await this.slots.findOne({ where: { id: b.slot.id } });
    if (slot) {
      slot.isBooked = false;
      await this.slots.save(slot);
    }

    return b;
  }
}
