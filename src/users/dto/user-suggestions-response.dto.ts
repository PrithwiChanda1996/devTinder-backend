import { ApiProperty } from '@nestjs/swagger';

export class UserSuggestionDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Age of the user',
    example: 28,
    required: false,
  })
  age?: number;

  @ApiProperty({
    description: 'Gender',
    example: 'male',
    enum: ['male', 'female', 'other'],
    required: false,
  })
  gender?: string;

  @ApiProperty({
    description: 'List of skills',
    example: ['JavaScript', 'React', 'Node.js'],
    type: [String],
    required: false,
  })
  skills?: string[];

  @ApiProperty({
    description: 'Bio/description',
    example: 'Passionate full-stack developer with 5 years of experience',
    required: false,
  })
  bio?: string;

  @ApiProperty({
    description: 'Current position/role',
    example: 'Senior Software Engineer',
    required: false,
  })
  currentPosition?: string;

  @ApiProperty({
    description: 'Current organisation',
    example: 'Tech Corp',
    required: false,
  })
  currentOrganisation?: string;

  @ApiProperty({
    description: 'Location',
    example: 'San Francisco, CA',
    required: false,
  })
  location?: string;

  @ApiProperty({
    description: 'Profile photo URL',
    example: 'https://example.com/photo.jpg',
    required: false,
  })
  profilePhoto?: string;

  @ApiProperty({
    description: 'GitHub profile URL',
    example: 'https://github.com/johndoe',
    required: false,
  })
  githubUrl?: string;

  @ApiProperty({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe',
    required: false,
  })
  linkedinUrl?: string;

  @ApiProperty({
    description: 'Portfolio website URL',
    example: 'https://johndoe.com',
    required: false,
  })
  portfolioUrl?: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  createdAt: Date;
}
