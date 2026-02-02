import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMaxSize,
  IsIn,
  Matches,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VALID_SKILLS } from '../../common/constants/skills.constant';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Age of the user',
    example: 28,
    minimum: 18,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  age?: number;

  @ApiPropertyOptional({
    description: 'Gender of the user',
    example: 'male',
    enum: ['male', 'female', 'other'],
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  @Transform(({ value }) => value?.toLowerCase())
  gender?: string;

  @ApiPropertyOptional({
    description: 'List of technical skills (max 10)',
    example: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    type: [String],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(VALID_SKILLS, { each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Bio or description about the user',
    example:
      'Full-stack developer with 5 years of experience in building scalable web applications.',
    minLength: 100,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(100)
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  bio?: string;

  @ApiPropertyOptional({
    description: 'Current job position/title',
    example: 'Senior Software Engineer',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  currentPosition?: string;

  @ApiPropertyOptional({
    description: 'Current organization/company',
    example: 'Tech Corp Inc.',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  currentOrganisation?: string;

  @ApiPropertyOptional({
    description: 'Location or city',
    example: 'San Francisco, CA',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  location?: string;

  @ApiPropertyOptional({
    description: 'GitHub profile URL',
    example: 'https://github.com/johndoe',
    pattern: '^https?:\\/\\/(www\\.)?github\\.com\\/.+$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/(www\.)?github\.com\/.+$/, {
    message: 'Please provide a valid GitHub URL',
  })
  githubUrl?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe',
    pattern: '^https?:\\/\\/(www\\.)?linkedin\\.com\\/.+$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/(www\.)?linkedin\.com\/.+$/, {
    message: 'Please provide a valid LinkedIn URL',
  })
  linkedinUrl?: string;

  @ApiPropertyOptional({
    description: 'Portfolio website URL',
    example: 'https://johndoe.dev',
    pattern: '^https?:\\/\\/.+\\..+$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+\..+$/, {
    message: 'Please provide a valid portfolio URL',
  })
  portfolioUrl?: string;
}
