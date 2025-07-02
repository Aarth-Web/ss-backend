import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { School } from '../school/school.schema';
import { UserRole } from './user-role.enum';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  registrationId: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'School' })
  school: School;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  email?: string;

  @Prop()
  mobile?: string;

  @Prop({ type: Object })
  additionalInfo?: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);
