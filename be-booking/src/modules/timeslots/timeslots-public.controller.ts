import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { TimeSlotsService } from './timeslots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CourtsService } from '../courts/courts.service';

@Controller('timeslots')
export class TimeSlotsPublicController {
  constructor(private ts: TimeSlotsService, private courts: CourtsService) {}

  @Get()
  findByDate(@Query('date') date: string, @Query('venueId') venueId?: string) {
    if (!date) return this.ts.findAll();
    return this.ts.findByDate(date, venueId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: { courtId: string; date: string; start: string; end: string }) {
    const court = await this.courts.findOne(body.courtId);
    return this.ts.createForCourt(court as any, body.date, [{ start: body.start, end: body.end }]);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ts.remove(id);
  }
}


