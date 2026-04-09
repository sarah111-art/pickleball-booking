import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { Booking } from '../../entities/booking.entity';
import { Payment } from '../../entities/payment.entity';
import { VnPayService } from './vnpay.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private payments: Repository<Payment>,
    @InjectRepository(Booking) private bookings: Repository<Booking>,
    private vnpayService: VnPayService,
    private configService: ConfigService,
  ) {}

  findAll() {
    return this.payments.find({
      relations: ['booking', 'booking.user', 'booking.court'],
      order: { createdAt: 'DESC' },
    });
  }

  async createOrder(bookingId: string, provider: string = 'qr') {
    const booking = await this.bookings.findOne({ 
      where: { id: bookingId },
      relations: ['court']
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Calculate deposit (50% of total)
    const depositAmount = Math.round(Number(booking.total) * 0.5);
    
    // Generate payment URL (VNPay or mock)
    const paymentUrl = this.generatePaymentUrl(bookingId, depositAmount);
    
    // Generate QR code as data URL
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(paymentUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
    }

    // Check if payment already exists
    let payment = await this.payments.findOne({ 
      where: { booking: { id: bookingId } },
      relations: ['booking']
    });

    const orderId = `BOOKING_${bookingId}_${Date.now()}`;

    if (payment) {
      payment.qrUrl = qrDataUrl;
      payment.paymentUrl = paymentUrl;
      payment.provider = provider;
      payment.status = 'pending';
      payment.providerOrderId = orderId;
    } else {
      payment = this.payments.create({ 
        booking, 
        provider, 
        status: 'pending', 
        qrUrl: qrDataUrl,
        paymentUrl: paymentUrl,
        providerOrderId: orderId,
      });
    }

    return this.payments.save(payment);
  }

  private generatePaymentUrl(bookingId: string, amount: number): string {
    // Check if VNPay is configured
    const vnpayTmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    const vnpaySecretKey = this.configService.get<string>('VNPAY_SECRET_KEY');

    if (vnpayTmnCode && vnpaySecretKey) {
      // Use VNPay
      const orderId = `BOOKING_${bookingId}_${Date.now()}`;
      return this.vnpayService.createPaymentUrl({
        orderId,
        amount,
        orderDescription: `Thanh toan dat coc dat san - Booking ${bookingId}`,
        orderType: 'other',
        locale: 'vn',
        currCode: 'VND',
      });
    }

    // Fallback to mock payment URL if VNPay not configured
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    return `${baseUrl}/payment/callback?bookingId=${bookingId}&amount=${amount}`;
  }

  async callback(providerOrderId: string, provider: string, success = true) {
    // naive: find payment by providerOrderId
    const p = await this.payments.findOne({ 
      where: { providerOrderId },
      relations: ['booking']
    });
    if (!p) throw new NotFoundException('Payment record not found');
    p.status = success ? 'paid' : 'failed';
    await this.payments.save(p);

    // mark booking as confirmed (not paid, because only 50% deposit is paid)
    if (success) {
      const b = await this.bookings.findOne({ where: { id: p.booking.id } });
      if (b) {
        b.status = 'confirmed'; // Changed from 'paid' to 'confirmed' since only deposit is paid
        await this.bookings.save(b);
      }
    }
    return p;
  }

  async status(bookingId: string) {
    return this.payments.findOne({ 
      where: { booking: { id: bookingId } },
      relations: ['booking']
    });
  }

  async verifyPayment(bookingId: string) {
    const payment = await this.payments.findOne({ 
      where: { booking: { id: bookingId } },
      relations: ['booking']
    });
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // In production, verify with payment gateway
    // For demo, we'll simulate verification
    if (payment.status === 'paid') {
      return { verified: true, payment };
    }

    return { verified: false, payment };
  }

  async handleVnpayReturn(query: Record<string, string>) {
    const verifyResult = this.vnpayService.verifyReturnUrl(query);
    
    if (!verifyResult.isValid) {
      return { success: false, bookingId: '', message: 'Invalid signature' };
    }

    // Extract booking ID from order ID (format: BOOKING_{bookingId}_{timestamp})
    const orderId = verifyResult.orderId;
    const bookingIdMatch = orderId.match(/^BOOKING_(.+?)_\d+$/);
    
    if (!bookingIdMatch) {
      return { success: false, bookingId: '', message: 'Invalid order ID format' };
    }

    const bookingId = bookingIdMatch[1];
    
    // Check response code: 00 = success
    if (verifyResult.responseCode === '00') {
      // Find payment by providerOrderId
      const payment = await this.payments.findOne({
        where: { providerOrderId: orderId },
        relations: ['booking'],
      });

      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.providerOrderId = orderId;
        await this.payments.save(payment);

        // Update booking status
        const booking = await this.bookings.findOne({ where: { id: bookingId } });
        if (booking) {
          booking.status = 'confirmed';
          await this.bookings.save(booking);
        }
      }

      return { success: true, bookingId, message: 'Payment successful' };
    }

    return { success: false, bookingId, message: `Payment failed: ${verifyResult.responseCode}` };
  }

  async handleVnpayIpn(query: Record<string, string>) {
    try {
      // IPN (Instant Payment Notification) is similar to return URL
      // but called by VNPay server, not user browser
      const result = await this.handleVnpayReturn(query);
      
      // Log IPN processing
      console.log('VNPay IPN processed:', {
        success: result.success,
        bookingId: result.bookingId,
        message: result.message,
      });
      
      return result;
    } catch (error: any) {
      console.error('Error processing VNPay IPN:', error);
      return {
        success: false,
        bookingId: '',
        message: error.message || 'Unknown error',
      };
    }
  }
}
