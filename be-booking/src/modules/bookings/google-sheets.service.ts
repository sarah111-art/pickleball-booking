import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

let google: any;
try {
  const googleapis = require('googleapis');
  google = googleapis.google;
} catch {
  // googleapis is optional
}

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets: any;
  private auth: any;

  constructor(private configService: ConfigService) {
    this.initializeGoogleSheets();
  }

  private initializeGoogleSheets() {
    try {
      if (!google) {
        this.logger.warn(
          'Google Sheets library not installed. Google Sheets integration will be disabled.',
        );
        return;
      }

      // Using environment variables for OAuth2
      const clientEmail = this.configService.get<string>(
        'GOOGLE_SHEETS_CLIENT_EMAIL',
      );
      const privateKey = this.configService.get<string>(
        'GOOGLE_SHEETS_PRIVATE_KEY',
      );

      if (!clientEmail || !privateKey) {
        this.logger.warn(
          'Google Sheets credentials not fully configured. Google Sheets integration will be disabled.',
        );
        return;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, '\n'),
          type: 'service_account',
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.auth = auth;
      this.sheets = google.sheets({ version: 'v4', auth });
    } catch (error) {
      this.logger.error('Failed to initialize Google Sheets:', error);
    }
  }

  async appendBookingToSheet(bookingData: {
    customerName: string;
    phoneNumber: string;
    courtName?: string;
    venueName?: string;
    timeSlot?: string;
    date?: string;
    location?: string;
    total?: number;
  }): Promise<void> {
    try {
      if (!this.sheets || !this.auth) {
        this.logger.warn('Google Sheets not initialized. Skipping save.');
        return;
      }

      const spreadsheetId = this.configService.get<string>(
        'GOOGLE_SHEETS_SPREADSHEET_ID'
      );

      if (!spreadsheetId) {
        this.logger.warn('Spreadsheet ID not configured. Skipping save.');
        return;
      }

      const values = [
        [
          bookingData.customerName || '',
          bookingData.phoneNumber || '',
          bookingData.courtName || '',
          bookingData.timeSlot || '',
          bookingData.date || '',
          bookingData.location || '',
        ],
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Trang tính1!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      this.logger.log(
        `Booking saved to Google Sheets: ${bookingData.customerName} (${bookingData.phoneNumber})`
      );
    } catch (error) {
      this.logger.error('Error appending to Google Sheets:', error);
      // Don't throw - we don't want to fail the booking if Google Sheets fails
    }
  }
}
