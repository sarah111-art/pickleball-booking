import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import * as querystring from 'querystring';

@Injectable()
export class VnPayService {
  private readonly tmnCode: string;
  private readonly secretKey: string;
  private readonly paymentUrl: string;
  private readonly returnUrl: string;
  private readonly ipnUrl: string;

  constructor(private configService: ConfigService) {
    // VNPay configuration from environment variables
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
    this.secretKey = this.configService.get<string>('VNPAY_SECRET_KEY') || '';
    
    // VNPay URLs
    // Sandbox: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
    // Production: https://vnpayment.vn/paymentv2/vpcpay.html
    this.paymentUrl = this.configService.get<string>('VNPAY_PAYMENT_URL') || 
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';
    
    this.returnUrl = `${baseUrl}/payment/callback`;
    this.ipnUrl = `${apiUrl}/payments/vnpay-ipn`;
  }

  /**
   * Create payment URL for VNPay
   */
  createPaymentUrl(params: {
    orderId: string;
    amount: number;
    orderDescription: string;
    orderType?: string;
    locale?: string;
    currCode?: string;
  }): string {
    const date = new Date();
    const createDate = this.formatDate(date);
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 minutes

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: params.locale || 'vn',
      vnp_CurrCode: params.currCode || 'VND',
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderDescription,
      vnp_OrderType: params.orderType || 'other',
      vnp_Amount: (params.amount * 100).toString(), // VNPay requires amount in cents
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: '127.0.0.1', // In production, get from request
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Sort params and create query string (without encoding for hash calculation)
    const sortedParams = this.sortObject(vnpParams);
    const queryString = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');
    
    // Create secure hash
    const hmac = createHmac('sha512', this.secretKey);
    const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');
    
    // Add hash to params
    sortedParams['vnp_SecureHash'] = signed;
    
    // Build final URL (without encoding)
    const finalQueryString = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');
    return `${this.paymentUrl}?${finalQueryString}`;
  }

  /**
   * Verify callback from VNPay
   */
  verifyReturnUrl(query: Record<string, string>): {
    isValid: boolean;
    orderId: string;
    amount: number;
    responseCode: string;
    transactionId: string;
  } {
    const vnpParams: Record<string, string> = {};
    let secureHash = '';

    // Extract all vnp_ params
    for (const key in query) {
      if (key.startsWith('vnp_')) {
        if (key === 'vnp_SecureHash') {
          secureHash = query[key];
        } else {
          vnpParams[key] = query[key];
        }
      }
    }

    // Remove secure hash from params
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort and create query string (without encoding for hash calculation)
    const sortedParams = this.sortObject(vnpParams);
    const queryString = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    // Verify hash
    const hmac = createHmac('sha512', this.secretKey);
    const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');

    const isValid = secureHash === signed;
    const responseCode = query['vnp_ResponseCode'] || '';
    const orderId = query['vnp_TxnRef'] || '';
    const amount = parseInt(query['vnp_Amount'] || '0') / 100; // Convert from cents
    const transactionId = query['vnp_TransactionNo'] || '';

    return {
      isValid,
      orderId,
      amount,
      responseCode,
      transactionId,
    };
  }

  /**
   * Verify IPN (Instant Payment Notification) from VNPay
   */
  verifyIpn(query: Record<string, string>): {
    isValid: boolean;
    orderId: string;
    amount: number;
    responseCode: string;
    transactionId: string;
  } {
    return this.verifyReturnUrl(query);
  }

  /**
   * Sort object by key
   */
  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  }

  /**
   * Format date to VNPay format (yyyyMMddHHmmss)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}

