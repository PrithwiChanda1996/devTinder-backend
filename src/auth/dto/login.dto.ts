import { IsString, IsEmail, IsOptional, Matches, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({
    description: 'Email address to login with',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @ApiPropertyOptional({
    description: 'Username to login with',
    example: 'johndoe123',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  username?: string;

  @ApiPropertyOptional({
    description: '10-digit mobile number to login with',
    example: '9876543210',
    pattern: '^[0-9]{10}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'Please provide a valid 10-digit mobile number',
  })
  mobileNumber?: string;

  @ApiProperty({
    description: 'Password for authentication',
    example: 'SecurePass123',
  })
  @IsString({ message: 'Password is required' })
  password: string;

  @ValidateIf((o) => !o.email && !o.username && !o.mobileNumber)
  @IsString({
    message: 'At least one identifier (email, username, or mobile) is required',
  })
  identifier?: string;
}
