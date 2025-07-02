import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { School, SchoolSchema } from './school.schema';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: School.name, schema: SchoolSchema }]),
    UserModule,
  ],
  providers: [SchoolService],
  controllers: [SchoolController],
  exports: [
    MongooseModule.forFeature([{ name: School.name, schema: SchoolSchema }]),
  ],
})
export class SchoolModule {}
