import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { BookingStatus } from '../../entities/booking.entity';
import { TimeSlot } from '../../entities/timeslot.entity';
import { User } from '../../entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private repo: Repository<Booking>,
    @InjectRepository(TimeSlot) private slots: Repository<TimeSlot>,
    private usersService: UsersService,
  ) {}

  async create(payload: { user: User; courtId: string; date: string; slotId: string; paymentMethod?: string; note?: string }) {
    const slot = await this.slots.findOne({ 
      where: { id: payload.slotId },
      relations: ['court']
    });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.isBooked) throw new BadRequestException('Slot already booked');

    // Calculate total from court price
    // Calculate hours from slot time
    const startTime = new Date(`2000-01-01T${slot.start}`);
    const endTime = new Date(`2000-01-01T${slot.end}`);
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    const courtPrice = Number(slot.court?.pricePerHour) || 250000; // Default 250k/hour
    const total = Math.round(courtPrice * hours);

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
      total,
    });

    return this.repo.save(booking);
  }

  async createByAdmin(payload: { userEmail: string; courtId: string; date: string; slotId: string; paymentMethod?: string; note?: string }) {
    const user = await this.usersService.findByEmail(payload.userEmail);
    if (!user) throw new NotFoundException(`Không tìm thấy user với email: ${payload.userEmail}`);
    return this.create({ user, courtId: payload.courtId, date: payload.date, slotId: payload.slotId, paymentMethod: payload.paymentMethod, note: payload.note });
  }

  findByUser(userId: string) {
    return this.repo.find({ 
      where: { user: { id: userId } }, 
      relations: ['slot', 'court', 'court.venue'] 
    });
  }

  find(query?: { courtId?: string; date?: string }) {
    const qb = this.repo.createQueryBuilder('b').leftJoinAndSelect('b.slot', 'slot').leftJoinAndSelect('b.court', 'court');
    if (query?.courtId) qb.andWhere('court.id = :id', { id: query.courtId });
    if (query?.date) qb.andWhere('b.date = :date', { date: query.date });
    return qb.getMany();
  }

  async findOne(id: string) {
    const b = await this.repo.findOne({ where: { id }, relations: ['user', 'court', 'slot'] });
    if (!b) throw new NotFoundException('Booking not found');
    return b;
  }

  async cancel(id: string, requesterId?: string) {
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

  async update(id: string, data: { date?: string; slotId?: string; status?: string; note?: string }) {
    const b = await this.findOne(id);

    if (data.date) b.date = data.date;
    if (data.status) {
      const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'paid'];
      if (!validStatuses.includes(data.status as BookingStatus)) {
        throw new BadRequestException('Invalid status');
      }
      b.status = data.status as BookingStatus;
    }
    if (data.note !== undefined) b.note = data.note;

    // If changing slot, need to handle old and new slot
    if (data.slotId && data.slotId !== b.slot.id) {
      // Release old slot
      const oldSlot = await this.slots.findOne({ where: { id: b.slot.id } });
      if (oldSlot) {
        oldSlot.isBooked = false;
        await this.slots.save(oldSlot);
      }

      // Book new slot
      const newSlot = await this.slots.findOne({ where: { id: data.slotId } });
      if (!newSlot) throw new NotFoundException('Slot not found');
      if (newSlot.isBooked) throw new BadRequestException('Slot already booked');

      newSlot.isBooked = true;
      await this.slots.save(newSlot);
      b.slot = newSlot;
    }

    return this.repo.save(b);
  }

  async delete(id: string) {
    const b = await this.findOne(id);

    // Release the slot first
    const slot = await this.slots.findOne({ where: { id: b.slot.id } });
    if (slot) {
      slot.isBooked = false;
      await this.slots.save(slot);
    }

    await this.repo.remove(b);
    return { success: true, message: 'Booking deleted' };
  }
}
