import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeSlot } from '../../entities/timeslot.entity';
import { TimeSlotsService } from './timeslots.service';
import { TimeSlotsController } from './timeslots.controller';
import { TimeSlotsPublicController } from './timeslots-public.controller';
import { CourtsModule } from '../courts/courts.module';

@Module({
  imports: [TypeOrmModule.forFeature([TimeSlot]), forwardRef(() => CourtsModule)],
  providers: [TimeSlotsService],
  controllers: [TimeSlotsController, TimeSlotsPublicController],
  exports: [TimeSlotsService],
})
export class TimeSlotsModule {}
