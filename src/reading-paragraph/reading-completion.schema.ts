import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user/user.schema';
import { ReadingAssignment } from './reading-assignment.schema';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class ReadingCompletion extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ReadingAssignment', required: true })
  assignment: ReadingAssignment;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  student: User;

  @Prop({ type: Date, required: true })
  completedAt: Date;

  @Prop()
  notes?: string;

  @Prop({ type: Number, min: 0, max: 100 })
  selfRating?: number; // Student's self-assessment out of 100

  @Prop({ type: Number, min: 0, max: 100 })
  teacherRating?: number; // Teacher's assessment out of 100

  @Prop()
  teacherFeedback?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  // Track reading time
  @Prop({ type: Number })
  readingDuration?: number; // in seconds

  // Track attempts
  @Prop({ type: Number, default: 1 })
  attemptCount: number;
}

export const ReadingCompletionSchema =
  SchemaFactory.createForClass(ReadingCompletion);
