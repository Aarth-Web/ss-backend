import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { School } from '../school/school.schema';
import { User } from 'src/user/user.schema';

@Schema({ timestamps: { createdAt: 'created', updatedAt: 'updated' } })
export class Classroom extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  teacher: User;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  students: User[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true })
  school: School;

  @Prop({ default: Date.now })
  created: Date;

  @Prop({ default: Date.now })
  updated: Date;
}

export const ClassroomSchema = SchemaFactory.createForClass(Classroom);
