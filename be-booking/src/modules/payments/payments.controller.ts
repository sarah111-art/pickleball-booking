import { Body, Controller, Get, Post, Query, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Post('create')
  create(@Body() body: any) {
    return this.svc.createOrder(body.bookingId, body.provider);
  }

  // VNPay endpoints - must be before dynamic routes like :bookingId
  @Get('vnpay-return')
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.svc.handleVnpayReturn(query);
    
    // Redirect to frontend with result
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = result.success
      ? `${frontendUrl}/payment/success?bookingId=${result.bookingId}`
      : `${frontendUrl}/payment/failed?bookingId=${result.bookingId}`;
    
    return res.redirect(redirectUrl);
  }

  @Get('vnpay-ipn')
  async vnpayIpn(@Query() query: any, @Res() res: Response, @Req() req: Request) {
    try {
      // Log IPN request for debugging
      console.log('VNPay IPN received:', {
        ip: req.ip || req.socket.remoteAddress,
        query: Object.keys(query),
        timestamp: new Date().toISOString(),
      });

      const result = await this.svc.handleVnpayIpn(query);
      
      // VNPay expects specific response format: RspCode=00 (success) or RspCode=99 (fail)
      const responseCode = result.success ? '00' : '99';
      
      // Set proper headers for VNPay
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(`RspCode=${responseCode}`);
    } catch (error: any) {
      console.error('VNPay IPN error:', error);
      // Always return valid response to VNPay, even on error
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send('RspCode=99');
    }
  }

  @Get('qr/:bookingId')
  async getQRCode(@Param('bookingId') bookingId: string) {
    return this.svc.createOrder(bookingId, 'vnpay');
  }

  @Post('callback')
  callback(@Body() body: any) {
    // body: { providerOrderId, provider, success }
    return this.svc.callback(body.providerOrderId, body.provider, body.success);
  }

  @Post('verify')
  async verifyPayment(@Body() body: { bookingId: string }) {
    return this.svc.verifyPayment(body.bookingId);
  }

  @Get('status')
  status(@Query('bookingId') bookingId: string) {
    return this.svc.status(bookingId);
  }
}
