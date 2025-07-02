import { Injectable, Logger } from '@nestjs/common';
import { TwilioService } from './twilio.service';

@Injectable()
export class TwilioTestService {
  private readonly logger = new Logger(TwilioTestService.name);

  constructor(private readonly twilioService: TwilioService) {}

  /**
   * Send a test SMS message to verify Twilio configuration
   * @param phoneNumber Phone number to send the test message to (should include country code)
   * @returns Promise resolving to boolean indicating success
   */
  async sendTestMessage(phoneNumber: string): Promise<boolean> {
    try {
      this.logger.log(`Sending test SMS to ${phoneNumber}`);

      const message =
        'This is a test message from your School System SMS service. If you received this, your Twilio configuration is working correctly.';

      const result = await this.twilioService.sendSMS(phoneNumber, message);

      if (result) {
        this.logger.log('Test SMS sent successfully');
      } else {
        this.logger.warn('Failed to send test SMS');
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Error sending test SMS: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
