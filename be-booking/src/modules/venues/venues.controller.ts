import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { VenuesService } from './venues.service';

@Controller('venues')
export class VenuesController {
  constructor(private svc: VenuesService) {}

  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/courts')
  findCourts(@Param('id') id: string) {
    return this.svc.findCourtsByVenue(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}

