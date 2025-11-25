import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Connection, ConnectionDocument, ConnectionStatus } from './entities/connection.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectModel(Connection.name)
    private connectionModel: Model<ConnectionDocument>,
    private usersService: UsersService,
  ) {}

  async sendConnectionRequest(fromUserId: string, toUserId: string): Promise<ConnectionDocument> {
    // Validate not sending to self
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot send connection request to yourself');
    }

    // Validate both users exist
    await this.usersService.findById(fromUserId);
    await this.usersService.findById(toUserId);

    // Check for existing connection (bidirectional)
    const existingConnection = await this.connectionModel.findOne({
      $or: [
        { fromUserId: new Types.ObjectId(fromUserId), toUserId: new Types.ObjectId(toUserId) },
        { fromUserId: new Types.ObjectId(toUserId), toUserId: new Types.ObjectId(fromUserId) },
      ],
    });

    if (existingConnection) {
      // Handle different scenarios based on existing connection
      if (existingConnection.status === ConnectionStatus.BLOCKED) {
        throw new ForbiddenException('Cannot perform this action');
      }

      // Check if the other user already sent a request
      if (
        existingConnection.fromUserId.toString() === toUserId &&
        existingConnection.status === ConnectionStatus.PENDING
      ) {
        throw new ConflictException(
          'User has already sent you a request. Please accept/reject it first',
        );
      }

      // Check if current user already sent a request
      if (
        existingConnection.fromUserId.toString() === fromUserId &&
        existingConnection.status === ConnectionStatus.PENDING
      ) {
        throw new ConflictException('Connection request already sent');
      }

      // Already connected
      if (existingConnection.status === ConnectionStatus.ACCEPTED) {
        throw new ConflictException('Already connected');
      }

      // Rejected - allow resend (no cooldown for now)
      if (existingConnection.status === ConnectionStatus.REJECTED) {
        // Delete old rejected connection and create new one
        await this.connectionModel.findByIdAndDelete(existingConnection._id);
      }
    }

    // Create new connection request
    const connection = new this.connectionModel({
      fromUserId: new Types.ObjectId(fromUserId),
      toUserId: new Types.ObjectId(toUserId),
      status: ConnectionStatus.PENDING,
    });

    return connection.save();
  }

  async acceptConnection(connectionId: string, userId: string): Promise<ConnectionDocument> {
    // Validate MongoDB ObjectId format
    if (!Types.ObjectId.isValid(connectionId)) {
      throw new BadRequestException('Invalid connection ID format');
    }

    const connection = await this.connectionModel.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Verify user is the receiver
    if (connection.toUserId.toString() !== userId) {
      throw new ForbiddenException('Forbidden - You are not authorized to perform this action');
    }

    // Verify status is pending
    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException(`Cannot accept connection with status: ${connection.status}`);
    }

    // Check for block status (shouldn't exist but double-check)
    const blockStatus = await this.checkBlockStatus(
      connection.fromUserId.toString(),
      connection.toUserId.toString(),
    );
    if (blockStatus) {
      throw new ForbiddenException('Cannot perform action due to block status');
    }

    connection.status = ConnectionStatus.ACCEPTED;
    return connection.save();
  }

  async rejectConnection(connectionId: string, userId: string): Promise<ConnectionDocument> {
    // Validate MongoDB ObjectId format
    if (!Types.ObjectId.isValid(connectionId)) {
      throw new BadRequestException('Invalid connection ID format');
    }

    const connection = await this.connectionModel.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Verify user is the receiver
    if (connection.toUserId.toString() !== userId) {
      throw new ForbiddenException('Forbidden - You are not authorized to perform this action');
    }

    // Verify status is pending
    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException(`Cannot reject connection with status: ${connection.status}`);
    }

    connection.status = ConnectionStatus.REJECTED;
    return connection.save();
  }

  async cancelRequest(connectionId: string, userId: string): Promise<void> {
    // Validate MongoDB ObjectId format
    if (!Types.ObjectId.isValid(connectionId)) {
      throw new BadRequestException('Invalid connection ID format');
    }

    const connection = await this.connectionModel.findById(connectionId);

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Verify user is the sender
    if (connection.fromUserId.toString() !== userId) {
      throw new ForbiddenException('Forbidden - You are not authorized to perform this action');
    }

    // Verify status is pending
    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel connection with status: ${connection.status}`);
    }

    await this.connectionModel.findByIdAndDelete(connectionId);
  }

  async blockUser(userId: string, targetUserId: string): Promise<ConnectionDocument> {
    // Validate not blocking self
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Validate target user exists
    await this.usersService.findById(targetUserId);

    // Check for existing connection
    const existingConnection = await this.connectionModel.findOne({
      $or: [
        { fromUserId: new Types.ObjectId(userId), toUserId: new Types.ObjectId(targetUserId) },
        { fromUserId: new Types.ObjectId(targetUserId), toUserId: new Types.ObjectId(userId) },
      ],
    });

    if (existingConnection) {
      // If already blocked by this user
      if (
        existingConnection.fromUserId.toString() === userId &&
        existingConnection.status === ConnectionStatus.BLOCKED
      ) {
        throw new ConflictException('User is already blocked');
      }

      // Delete existing connection and create new blocked one
      await this.connectionModel.findByIdAndDelete(existingConnection._id);
    }

    // Create blocked connection (blocker is fromUserId)
    const connection = new this.connectionModel({
      fromUserId: new Types.ObjectId(userId),
      toUserId: new Types.ObjectId(targetUserId),
      status: ConnectionStatus.BLOCKED,
    });

    return connection.save();
  }

  async unblockUser(userId: string, targetUserId: string): Promise<void> {
    // Validate not unblocking self
    if (userId === targetUserId) {
      throw new BadRequestException('Invalid operation');
    }

    // Find blocked connection where current user is the blocker
    const connection = await this.connectionModel.findOne({
      fromUserId: new Types.ObjectId(userId),
      toUserId: new Types.ObjectId(targetUserId),
      status: ConnectionStatus.BLOCKED,
    });

    if (!connection) {
      throw new NotFoundException('No blocked connection found');
    }

    // Delete the connection document
    await this.connectionModel.findByIdAndDelete(connection._id);
  }

  async getReceivedRequests(userId: string): Promise<ConnectionDocument[]> {
    return this.connectionModel
      .find({
        toUserId: new Types.ObjectId(userId),
        status: ConnectionStatus.PENDING,
      })
      .populate('fromUserId', 'username firstName lastName profilePhoto')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getSentRequests(userId: string): Promise<ConnectionDocument[]> {
    return this.connectionModel
      .find({
        fromUserId: new Types.ObjectId(userId),
        status: ConnectionStatus.PENDING,
      })
      .populate('toUserId', 'username firstName lastName profilePhoto')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getConnections(userId: string): Promise<ConnectionDocument[]> {
    return this.connectionModel
      .find({
        $or: [
          { fromUserId: new Types.ObjectId(userId), status: ConnectionStatus.ACCEPTED },
          { toUserId: new Types.ObjectId(userId), status: ConnectionStatus.ACCEPTED },
        ],
      })
      .populate('fromUserId', 'username firstName lastName profilePhoto')
      .populate('toUserId', 'username firstName lastName profilePhoto')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getConnectionStatus(
    userId: string,
    targetUserId: string,
  ): Promise<{ status: ConnectionStatus | null; connectionId: string | null; message: string }> {
    // Validate not checking self
    if (userId === targetUserId) {
      return {
        status: null,
        connectionId: null,
        message: 'Cannot check connection with yourself',
      };
    }

    // Check for existing connection (bidirectional)
    const connection = await this.connectionModel.findOne({
      $or: [
        { fromUserId: new Types.ObjectId(userId), toUserId: new Types.ObjectId(targetUserId) },
        { fromUserId: new Types.ObjectId(targetUserId), toUserId: new Types.ObjectId(userId) },
      ],
    });

    if (!connection) {
      return {
        status: null,
        connectionId: null,
        message: 'No connection exists',
      };
    }

    let message = '';
    switch (connection.status) {
      case ConnectionStatus.PENDING:
        if (connection.fromUserId.toString() === userId) {
          message = 'Connection request sent';
        } else {
          message = 'Connection request received';
        }
        break;
      case ConnectionStatus.ACCEPTED:
        message = 'Connected';
        break;
      case ConnectionStatus.REJECTED:
        message = 'Connection request rejected';
        break;
      case ConnectionStatus.BLOCKED:
        if (connection.fromUserId.toString() === userId) {
          message = 'User blocked';
        } else {
          message = 'Blocked by user';
        }
        break;
    }

    return {
      status: connection.status,
      connectionId: connection._id.toString(),
      message,
    };
  }

  async checkBlockStatus(userId: string, targetUserId: string): Promise<boolean> {
    const blockExists = await this.connectionModel.findOne({
      $or: [
        {
          fromUserId: new Types.ObjectId(userId),
          toUserId: new Types.ObjectId(targetUserId),
          status: ConnectionStatus.BLOCKED,
        },
        {
          fromUserId: new Types.ObjectId(targetUserId),
          toUserId: new Types.ObjectId(userId),
          status: ConnectionStatus.BLOCKED,
        },
      ],
    });

    return !!blockExists;
  }
}
