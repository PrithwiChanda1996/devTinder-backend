import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnerGuard } from './guards/owner.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('suggestions')
  @ApiOperation({
    summary: 'Get random user suggestions for connection',
    description:
      'Get a random set of suggested users to connect with, excluding users you have already connected with, sent requests to, or been blocked by. Each request returns a fresh random set.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of random suggestions to return (default: 10, max: 50)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Random list of suggested users',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async getSuggestions(@CurrentUser('id') userId: string, @Query('limit') limit?: number) {
    // Validate and set safe limit (between 1-50)
    const safeLimit = limit ? Math.min(Math.max(Number(limit), 1), 50) : 10;

    const suggestions = await this.usersService.getSuggestions(userId, safeLimit);

    return {
      success: true,
      data: suggestions,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);

    return {
      success: true,
      data: user,
    };
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get user by email address' })
  @ApiParam({
    name: 'email',
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);

    return {
      success: true,
      data: user,
    };
  }

  @Get('mobile/:mobileNumber')
  @ApiOperation({ summary: 'Get user by mobile number' })
  @ApiParam({
    name: 'mobileNumber',
    description: '10-digit mobile number',
    example: '9876543210',
  })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByMobile(@Param('mobileNumber') mobileNumber: string) {
    const user = await this.usersService.findByMobile(mobileNumber);

    return {
      success: true,
      data: user,
    };
  }

  @Patch('profile')
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: 'Update user profile (own profile only)' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own profile',
  })
  async updateProfile(@CurrentUser('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.usersService.updateProfile(userId, updateUserDto);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }
}
