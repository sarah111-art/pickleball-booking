import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards, Delete } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private svc: BookingsService) {}

  @Get('availability')
  getAvailability(@Query('courtId') courtId: string, @Query('date') date: string) {
    return this.svc.findAvailability(courtId, date);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() body: any) {
    const user = req.user;
    return this.svc.create({ 
      user, 
      courtId: body.courtId, 
      date: body.date, 
      startTime: body.startTime, 
      endTime: body.endTime, 
      paymentMethod: body.paymentMethod, 
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      note: body.note,
      totalAmount: body.totalAmount,
      paymentPercentage: body.paymentPercentage,
      selectedProducts: body.selectedProducts,
      selectedRentals: body.selectedRentals 
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin')
  createByAdmin(@Body() body: any) {
    return this.svc.createByAdmin({
      userEmail: body.userEmail,
      courtId: body.courtId,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      paymentMethod: body.paymentMethod,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      note: body.note,
    });
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
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.svc.cancel(id, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, {
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      courtId: body.courtId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      status: body.status,
      note: body.note,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
