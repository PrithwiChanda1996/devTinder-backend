import { IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendConnectionRequestDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the user to send connection request to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'Target user ID is required' })
  @IsMongoId({ message: 'Invalid user ID format' })
  toUserId: string;
}

