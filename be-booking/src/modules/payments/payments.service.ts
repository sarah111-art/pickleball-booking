import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../../entities/booking.entity';
import { Payment } from '../../entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private payments: Repository<Payment>,
    @InjectRepository(Booking) private bookings: Repository<Booking>,
  ) {}

  async createOrder(bookingId: number, provider: string) {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const record = this.payments.create({ booking, provider, status: 'pending', qrUrl: 'https://example.com/qrcode' });
    return this.payments.save(record);
  }

  async callback(providerOrderId: string, provider: string, success = true) {
    // naive: find payment by providerOrderId
    const p = await this.payments.findOne({ where: { providerOrderId } });
    if (!p) throw new NotFoundException('Payment record not found');
    p.status = success ? 'paid' : 'failed';
    await this.payments.save(p);

    // mark booking as paid
    if (success) {
      const b = p.booking;
      if (b) {
        b.status = 'paid';
        await this.bookings.save(b as any);
      }
    }
    return p;
  }

  async status(bookingId: number) {
    return this.payments.findOne({ where: { booking: { id: bookingId } } });
  }
}
