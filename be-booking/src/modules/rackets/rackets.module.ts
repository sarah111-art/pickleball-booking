import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Racket } from '../../entities/racket.entity';
import { RacketsService } from './rackets.service';
import { RacketsController } from './rackets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Racket])],
  controllers: [RacketsController],
  providers: [RacketsService],
  exports: [RacketsService],
})
export class RacketsModule {}
