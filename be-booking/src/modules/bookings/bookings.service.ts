import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { BookingStatus } from '../../entities/booking.entity';
import { Court } from '../../entities/court.entity';
import { User } from '../../entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private repo: Repository<Booking>,
    @InjectRepository(Court) private courts: Repository<Court>,
    private usersService: UsersService,
  ) {}

  async checkAvailability(courtId: string, date: string, startTime: string, endTime: string, excludeBookingId?: string) {
    // Tìm các đơn đặt sân bị trùng thời gian
    // Một đơn trùng nếu: (start < existingEnd) AND (end > existingStart)
    const query = this.repo.createQueryBuilder('booking')
      .where('booking.courtId = :courtId', { courtId })
      .andWhere('booking.date = :date', { date })
      .andWhere('booking.status NOT IN (:...badStatus)', { badStatus: ['cancelled', 'expired'] })
      .andWhere('booking.startTime < :endTime', { endTime })
      .andWhere('booking.endTime > :startTime', { startTime });

    if (excludeBookingId) {
      query.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const overlap = await query.getOne();
    return !overlap;
  }

  async findAvailability(courtId: string, date: string) {
    const bookings = await this.repo.find({
      where: {
        court: { id: courtId },
        date,
        status: Not('cancelled' as any)
      },
      select: ['startTime', 'endTime']
    });

    const court = await this.courts.findOne({ where: { id: courtId } });
    if (!court) throw new NotFoundException('Court not found');

    return {
      pricePerHour: court.pricePerHour || 150000,
      bookedSlots: bookings.map(b => ({
        start: b.startTime,
        end: b.endTime
      }))
    };
  }

  async create(payload: { user?: User; courtId: string; date: string; startTime: string; endTime: string; paymentMethod?: string; customerName?: string; customerPhone?: string; note?: string; totalAmount?: number; paymentPercentage?: number; selectedProducts?: any[]; selectedRentals?: any[] }) {
    const isAvailable = await this.checkAvailability(payload.courtId, payload.date, payload.startTime, payload.endTime);
    if (!isAvailable) {
      throw new BadRequestException('Sân đã được đặt trong khoảng thời gian này');
    }

    const court = await this.courts.findOneBy({ id: payload.courtId });
    if (!court) throw new NotFoundException('Court not found');

    // Calculate total if not provided
    let total = payload.totalAmount;
    if (total === undefined) {
      const start = new Date(`2000-01-01T${payload.startTime}`);
      const end = new Date(`2000-01-01T${payload.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const courtPrice = Number(court.pricePerHour) || 150000;
      total = Math.round(courtPrice * hours);
    }

    const booking = this.repo.create({
      user: payload.user,
      court: { id: payload.courtId } as any,
      startTime: payload.startTime,
      endTime: payload.endTime,
      date: payload.date,
      paymentMethod: payload.paymentMethod,
      customerName: payload.customerName || payload.user?.fullName || undefined,
      customerPhone: payload.customerPhone || payload.user?.phone || undefined,
      paymentPercentage: payload.paymentPercentage || 100,
      note: payload.note,
      status: 'pending',
      total,
      bookingItems: JSON.stringify({
        products: payload.selectedProducts || [],
        rentals: payload.selectedRentals || []
      })
    });

    return this.repo.save(booking);
  }

  async createByAdmin(payload: { userEmail: string; courtId: string; date: string; startTime: string; endTime: string; paymentMethod?: string; customerName?: string; customerPhone?: string; note?: string }) {
    const user = await this.usersService.findByEmail(payload.userEmail);
    if (!user) throw new NotFoundException(`Không tìm thấy user với email: ${payload.userEmail}`);
    return this.create({ 
      user, 
      courtId: payload.courtId, 
      date: payload.date, 
      startTime: payload.startTime, 
      endTime: payload.endTime, 
      paymentMethod: payload.paymentMethod, 
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      note: payload.note 
    });
  }

  findByUser(userId: string) {
    return this.repo.find({ 
      where: { user: { id: userId } }, 
      relations: ['court', 'court.venue'],
      order: { date: 'DESC', startTime: 'DESC' }
    });
  }

  find(query?: { courtId?: string; date?: string }) {
    const qb = this.repo.createQueryBuilder('b')
      .leftJoinAndSelect('b.court', 'court')
      .leftJoinAndSelect('court.venue', 'venue')
      .leftJoinAndSelect('b.user', 'user');
    if (query?.courtId) qb.andWhere('court.id = :id', { id: query.courtId });
    if (query?.date) qb.andWhere('b.date = :date', { date: query.date });
    qb.orderBy('b.date', 'DESC').addOrderBy('b.startTime', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string) {
    const b = await this.repo.findOne({ where: { id }, relations: ['user', 'court'] });
    if (!b) throw new NotFoundException('Booking not found');
    return b;
  }

  async cancel(id: string, requesterId?: string) {
    const b = await this.findOne(id);
    if (b.status === 'cancelled') return b;
    b.status = 'cancelled';
    return this.repo.save(b);
  }

  async update(id: string, data: { date?: string; startTime?: string; endTime?: string; status?: string; note?: string; courtId?: string; customerName?: string; customerPhone?: string }) {
    const b = await this.findOne(id);

    if (data.courtId) {
      b.court = { id: data.courtId } as any;
    }
    if (data.date) b.date = data.date;
    if (data.startTime) b.startTime = data.startTime;
    if (data.endTime) b.endTime = data.endTime;
    if (data.status) {
      const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'paid'];
      if (!validStatuses.includes(data.status as BookingStatus)) {
        throw new BadRequestException('Invalid status');
      }
      b.status = data.status as BookingStatus;
    }
    if (data.note !== undefined) b.note = data.note;
    if (data.customerName !== undefined) b.customerName = data.customerName;
    if (data.customerPhone !== undefined) b.customerPhone = data.customerPhone;

    // Check availability if time or date changed
    if (data.date || data.startTime || data.endTime) {
      const isAvailable = await this.checkAvailability(
        b.court.id, 
        b.date, 
        b.startTime, 
        b.endTime, 
        b.id
      );
      if (!isAvailable) throw new BadRequestException('Thời gian này đã có người đặt');
    }

    return this.repo.save(b);
  }

  async delete(id: string) {
    const b = await this.findOne(id);
    await this.repo.remove(b);
    return { success: true, message: 'Booking deleted' };
  }
}
