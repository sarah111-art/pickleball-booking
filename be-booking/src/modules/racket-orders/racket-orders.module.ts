import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacketOrder } from '../../entities/racket-order.entity';
import { RacketOrdersService } from './racket-orders.service';
import { RacketOrdersController } from './racket-orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RacketOrder])],
  providers: [RacketOrdersService],
  controllers: [RacketOrdersController],
  exports: [RacketOrdersService],
})
export class RacketOrdersModule {}
