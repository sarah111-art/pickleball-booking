import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.svc.createOrder(body.bookingId, body.provider);
  }

  @Post('callback')
  callback(@Body() body: any) {
    // body: { providerOrderId, provider, success }
    return this.svc.callback(body.providerOrderId, body.provider, body.success);
  }

  @Get('status')
  status(@Query('bookingId') bookingId: string) {
    return this.svc.status(Number(bookingId));
  }
}
