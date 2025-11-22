import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ConnectionDocument = Connection & Document;

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

@Schema({ timestamps: true })
export class Connection {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  fromUserId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  toUserId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ConnectionStatus),
    default: ConnectionStatus.PENDING,
    required: true,
  })
  status: ConnectionStatus;
}

export const ConnectionSchema = SchemaFactory.createForClass(Connection);

// Create compound indexes
ConnectionSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
ConnectionSchema.index({ toUserId: 1, status: 1 });
ConnectionSchema.index({ fromUserId: 1, status: 1 });

