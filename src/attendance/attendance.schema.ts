import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Attendance extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Classroom', required: true })
  classroom: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop([
    {
      student: { type: Types.ObjectId, ref: 'User' },
      present: Boolean,
    },
  ])
  records: { student: Types.ObjectId; present: boolean }[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ type: Boolean, default: false })
  smsSent: boolean;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  smsNotifiedStudents: Types.ObjectId[];
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
