import { Controller, Get, Query } from '@nestjs/common';
import { TimeSlotsService } from './timeslots.service';

@Controller('timeslots')
export class TimeSlotsPublicController {
  constructor(private ts: TimeSlotsService) {}

  @Get()
  findByDate(@Query('date') date: string, @Query('venueId') venueId?: string) {
    if (!date) return [];
    return this.ts.findByDate(date, venueId);
  }
}


