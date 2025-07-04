import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../user/user.schema';
import { Classroom } from '../../classroom/classroom.schema';
import { Model } from 'mongoose';
import { TwilioService } from './twilio.service';
import { TranslationService } from './translation.service';
import { ParentLanguage } from '../../user/parent-language.enum';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<Classroom>,
    private readonly twilioService: TwilioService,
    private readonly translationService: TranslationService,
  ) {}

  /**
   * Get absence message in the specified language using translation API
   */
  private async getAbsenceMessageInLanguage(
    language: string | ParentLanguage,
    studentName: string,
    classroomName: string,
    formattedDate: string,
    schoolName: string = 'School',
  ): Promise<string> {
    // If English, return the message directly without translation
    if (language.toLowerCase() === 'english') {
      return `Dear Parent, ${studentName} was absent from class ${classroomName} on date ${formattedDate}. – ${schoolName}`;
    }

    // Create the English template message
    const englishMessage = `Dear Parent, ${studentName} was absent from class ${classroomName} on date ${formattedDate}. – ${schoolName}`;

    try {
      // Get the target language code for RapidAPI
      const targetLangCode = this.translationService.getTargetLanguageCode(
        language.toString(),
      );

      // Translate the message
      const translatedMessage = await this.translationService.translateText(
        englishMessage,
        'en',
        targetLangCode,
      );

      return translatedMessage;
    } catch (error) {
      this.logger.error(
        `Translation failed: ${error.message}. Using English message.`,
      );
      return englishMessage; // Fallback to English if translation fails
    }
  }

  /**
   * Format date based on language
   */
  private formatDateForLanguage(date: Date, language: string): string {
    // Default English formatting
    const englishFormatted = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Map of language codes for date formatting
    const languageMap = {
      english: 'en-US',
      hindi: 'hi-IN',
      marathi: 'mr-IN',
      tamil: 'ta-IN',
      telugu: 'te-IN',
      kannada: 'kn-IN',
      malayalam: 'ml-IN',
      gujarati: 'gu-IN',
      bengali: 'bn-IN',
      punjabi: 'pa-IN',
      urdu: 'ur-PK',
      odia: 'or-IN',
    };

    // Try to use language-specific formatting, fall back to English if not supported
    try {
      const langCode = languageMap[language.toLowerCase()];
      if (langCode) {
        return date.toLocaleDateString(langCode, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to format date for language ${language}, using English instead`,
      );
    }

    return englishFormatted;
  }

  /**
   * Trigger SMS sending to parents of absent students without waiting
   * This method will start the process and return immediately
   */
  triggerSmsToParents(
    studentIds: string[],
    classroomId: string,
    date: Date,
  ): void {
    // Start the SMS sending process in the background without awaiting
    this.sendSmsToParents(studentIds, classroomId, date)
      .then((result) => {
        this.logger.log(`SMS sending process completed with result: ${result}`);
      })
      .catch((error) => {
        this.logger.error(`SMS sending process failed: ${error.message}`);
      });
  }

  /**
   * Send SMS to parents of absent students
   * This is the actual implementation that runs asynchronously
   */
  private async sendSmsToParents(
    studentIds: string[],
    classroomId: string,
    date: Date,
  ): Promise<boolean> {
    try {
      // Get students with their mobile numbers and additionalInfo for parentLanguage
      const students = await this.userModel
        .find({ _id: { $in: studentIds } })
        .select('name mobile additionalInfo')
        .exec();

      // Get classroom name and school name using the provided classroomId
      const classroom = await this.classroomModel
        .findById(classroomId)
        .select('name school')
        .populate('school', 'name')
        .exec();
      const classroomName = classroom?.name || 'Unknown';

      // Get school name from the populated school relationship
      const schoolName = classroom?.school?.name || 'School';

      let successCount = 0;
      let failureCount = 0;

      // Process each student in parallel with Promise.all
      const sendPromises = students.map(async (student) => {
        if (!student.mobile) {
          this.logger.warn(
            `No mobile number found for student ${student.name}`,
          );
          return false;
        }

        try {
          // Get parent's preferred language from additionalInfo
          const parentLanguage =
            student.additionalInfo?.parentLanguage || 'english';

          // Format date according to parent's language
          const formattedDate = this.formatDateForLanguage(
            date,
            parentLanguage,
          );

          // Format the SMS message based on parent's language - await the translation
          const message = await this.getAbsenceMessageInLanguage(
            parentLanguage,
            student.name,
            classroomName,
            formattedDate,
            schoolName,
          );

          this.logger.log(
            `Sending SMS to ${student.name}'s parent at ${student.mobile} in ${parentLanguage}: ${message}`,
          );

          // Send SMS using Twilio service
          const sent = await this.twilioService.sendSMS(
            student.mobile,
            message,
          );

          if (sent) {
            this.logger.log(
              `Successfully sent SMS to ${student.name}'s parent`,
            );
            return true;
          } else {
            this.logger.warn(`Failed to send SMS to ${student.name}'s parent`);
            return false;
          }
        } catch (err: any) {
          this.logger.error(
            `Error sending SMS to ${student.name}: ${err.message}`,
          );
          return false;
        }
      });

      // Wait for all sending operations to complete
      const results = await Promise.all(sendPromises);

      // Count successes and failures
      successCount = results.filter((result) => result).length;
      failureCount = results.filter((result) => !result).length;

      this.logger.log(
        `SMS notification summary: ${successCount} sent, ${failureCount} failed`,
      );
      return successCount > 0 || students.length === 0;
    } catch (error: any) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      return false;
    }
  }
}
