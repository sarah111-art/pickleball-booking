import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../entities/booking.entity';
import { Court } from '../../entities/court.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Court]),
    UsersModule,
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
