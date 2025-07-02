import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendance, AttendanceSchema } from './attendance.schema';
import { Classroom, ClassroomSchema } from '../classroom/classroom.schema';
import { User, UserSchema } from '../user/user.schema';
import { SmsService } from './services/sms.service';
import { TwilioService } from './services/twilio.service';
import { TwilioTestService } from './services/twilio-test.service';
import { TranslationService } from './services/translation.service';
import { ConfigModule } from '@nestjs/config';
import { ClassroomModule } from '../classroom/classroom.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Classroom.name, schema: ClassroomSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ClassroomModule,
  ],
  providers: [
    AttendanceService,
    SmsService,
    TwilioService,
    TwilioTestService,
    TranslationService,
  ],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
