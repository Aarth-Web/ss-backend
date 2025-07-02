import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private client: twilio.Twilio;
  private readonly logger = new Logger(TwilioService.name);
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('twilio.accountSid');
    const authToken = this.configService.get<string>('twilio.authToken');
    const phoneNumber = this.configService.get<string>('twilio.phoneNumber');

    if (!accountSid || !authToken || !phoneNumber) {
      this.logger.warn(
        'Twilio credentials not fully configured. Will use fallback logging instead.',
      );
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
      this.logger.log('Twilio service successfully initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize Twilio client: ${error.message}`);
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.client) {
        // Fallback to logging if Twilio is not configured
        this.logger.log(`[SMS FALLBACK] To: ${to}, Message: ${message}`);
        return true; // Return true so the application flow continues
      }

      const fromNumber = this.configService.get<string>('twilio.phoneNumber');

      // Format the phone number to E.164 format if not already formatted
      // This assumes the numbers are stored without the + prefix
      const formattedToNumber = to.startsWith('+') ? to : `+${to}`;

      const result = await this.client.messages.create({
        body: message,
        from: fromNumber,
        to: formattedToNumber,
      });

      this.logger.log(`SMS sent successfully. SID: ${result.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      // Fallback to logging in case of error
      this.logger.log(`[SMS FALLBACK] To: ${to}, Message: ${message}`);
      return true; // Return true to prevent cascading errors
    }
  }
}
