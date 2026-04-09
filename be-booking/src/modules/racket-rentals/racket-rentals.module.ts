import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacketRental } from '../../entities/racket-rental.entity';
import { RacketRentalsService } from './racket-rentals.service';
import { RacketRentalsController } from './racket-rentals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RacketRental])],
  controllers: [RacketRentalsController],
  providers: [RacketRentalsService],
  exports: [RacketRentalsService],
})
export class RacketRentalsModule {}
