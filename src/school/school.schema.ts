import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class School extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  registrationId: string;

  @Prop()
  address: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const SchoolSchema = SchemaFactory.createForClass(School);
