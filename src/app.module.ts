import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SchoolModule } from './school/school.module';
import { ClassroomModule } from './classroom/classroom.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import twilioConfig from './config/twilio.config';
import rapidapiConfig from './config/rapidapi.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, twilioConfig, rapidapiConfig],
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/ss-backend',
    ),
    AuthModule,
    UserModule,
    SchoolModule,
    ClassroomModule,
    AttendanceModule,
  ],
})
export class AppModule {}
