import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TimeSlotsService } from '../timeslots/timeslots.service';

@Controller('courts')
export class CourtsController {
  constructor(private svc: CourtsService, private ts: TimeSlotsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Get()
  findAll(@Query() q: any) {
    return this.svc.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/slots')
  findSlotsAlias(@Param('id') id: string, @Query('date') date?: string) {
    if (!date) return [];
    return this.ts.findByCourtAndDate(id, date);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
