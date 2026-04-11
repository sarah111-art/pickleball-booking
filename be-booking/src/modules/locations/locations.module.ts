import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../../entities/location.entity';
import { Court } from '../../entities/court.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Court])],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
