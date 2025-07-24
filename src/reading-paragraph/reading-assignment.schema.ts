import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user/user.schema';
import { Classroom } from '../classroom/classroom.schema';
import { ReadingParagraph } from './reading-paragraph.schema';

export enum AssignmentType {
  INDIVIDUAL = 'individual',
  CLASSROOM = 'classroom',
}

export enum AssignmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class ReadingAssignment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ReadingParagraph', required: true })
  paragraph: ReadingParagraph;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy: User;

  @Prop({ type: String, enum: AssignmentType, required: true })
  type: AssignmentType;

  // For individual assignments
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  students: User[];

  // For classroom assignments
  @Prop({ type: Types.ObjectId, ref: 'Classroom' })
  classroom: Classroom;

  @Prop({ type: Date, required: true })
  dueDate: Date;

  @Prop()
  instructions?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const ReadingAssignmentSchema =
  SchemaFactory.createForClass(ReadingAssignment);
