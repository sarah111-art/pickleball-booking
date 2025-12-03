import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { VnPayService } from './vnpay.service';
import { Booking } from '../../entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Booking])],
  providers: [PaymentsService, VnPayService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
