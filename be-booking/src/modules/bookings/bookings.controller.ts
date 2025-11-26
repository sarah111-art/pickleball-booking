import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private svc: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() body: any) {
    const user = req.user;
    return this.svc.create({ user, courtId: body.courtId, date: body.date, slotId: body.slotId, paymentMethod: body.paymentMethod, note: body.note });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  my(@Req() req: any) {
    return this.svc.findByUser(req.user.id);
  }

  @Get()
  find(@Query() q: any) {
    return this.svc.find(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.svc.cancel(id, req.user?.id);
  }
}
