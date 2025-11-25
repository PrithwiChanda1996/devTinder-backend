import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({
    description: 'Unique username (case-insensitive)',
    example: 'johndoe123',
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  username: string;

  @ApiProperty({
    description: 'Email address (case-insensitive)',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    description: '10-digit mobile number',
    example: '9876543210',
    pattern: '^[0-9]{10}$',
  })
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'Please provide a valid 10-digit mobile number',
  })
  mobileNumber: string;

  @ApiProperty({
    description: 'Password for the account',
    example: 'SecurePass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({
    description: 'Age of the user',
    example: 25,
    minimum: 18,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(18, { message: 'Age must be at least 18' })
  @Max(100, { message: 'Age cannot exceed 100' })
  age?: number;

  @ApiPropertyOptional({
    description: 'Gender of the user',
    example: 'male',
    enum: ['male', 'female', 'other'],
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'], {
    message: 'Gender must be either male, female, or other',
  })
  @Transform(({ value }) => value?.toLowerCase())
  gender?: string;
}
