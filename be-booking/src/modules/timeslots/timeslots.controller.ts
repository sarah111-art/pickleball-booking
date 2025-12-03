import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { TimeSlotsService } from './timeslots.service';
import { CourtsService } from '../courts/courts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courts')
export class TimeSlotsController {
  constructor(private ts: TimeSlotsService, private courts: CourtsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/timeslots')
  async createForCourt(@Param('id') id: string, @Body() body: any) {
    // body: { date: '2025-01-10', slots: [{start,end},{..}] }
    const court = await this.courts.findOne(id);
    return this.ts.createForCourt(court as any, body.date, body.slots || []);
  }

  @Get(':id/timeslots')
  findForCourt(@Param('id') id: string, @Query('date') date?: string) {
    if (!date) return [];
    return this.ts.findByCourtAndDate(id, date);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/timeslots/:id')
  remove(@Param('id') id: string) {
    return this.ts.remove(id);
  }
}
