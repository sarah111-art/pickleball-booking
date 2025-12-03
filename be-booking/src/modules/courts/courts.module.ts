import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Court } from '../../entities/court.entity';
import { CourtsService } from './courts.service';
import { CourtsController } from './courts.controller';
import { LocationsModule } from '../locations/locations.module';
import { UploadModule } from '../upload/upload.module';
import { TimeSlotsModule } from '../timeslots/timeslots.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Court]),
    LocationsModule,
    UploadModule,
    forwardRef(() => TimeSlotsModule),
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}
