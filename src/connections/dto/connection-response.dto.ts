import { ApiProperty } from '@nestjs/swagger';
import { ConnectionStatus } from '../entities/connection.entity';

class UserBasicInfo {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profilePhoto?: string;
}

export class ConnectionResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ type: UserBasicInfo })
  fromUser: UserBasicInfo;

  @ApiProperty({ type: UserBasicInfo })
  toUser: UserBasicInfo;

  @ApiProperty({
    enum: ConnectionStatus,
    example: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @ApiProperty({ example: '2024-11-22T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-11-22T10:30:00.000Z' })
  updatedAt: Date;
}

export class ConnectionStatusResponseDto {
  @ApiProperty({
    enum: ConnectionStatus,
    example: ConnectionStatus.PENDING,
    nullable: true,
  })
  status: ConnectionStatus | null;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', nullable: true })
  connectionId: string | null;

  @ApiProperty({
    example: 'Connection request sent',
    description: 'Human-readable status message',
  })
  message: string;
}

