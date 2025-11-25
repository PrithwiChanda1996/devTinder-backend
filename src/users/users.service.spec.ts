import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Connection } from '../connections/entities/connection.entity';
import { createMockModel, mockUser } from '../../test/helpers/mock-factories';
import { validUpdateUserDto } from '../../test/helpers/test-fixtures';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;
  let connectionModel: any;

  beforeEach(async () => {
    const mockUserModel = createMockModel(mockUser());
    const mockConnectionModel = createMockModel({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Connection.name),
          useValue: mockConnectionModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get(getModelToken(User.name));
    connectionModel = module.get(getModelToken(Connection.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = mockUser();
      const selectMock = jest.fn().mockResolvedValue(user);
      userModel.findById.mockReturnValue({ select: selectMock });

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(userModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      userModel.findById.mockReturnValue({ select: selectMock });

      await expect(service.findById('507f1f77bcf86cd799439011')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const user = mockUser();
      const selectMock = jest.fn().mockResolvedValue(user);
      userModel.findOne.mockReturnValue({ select: selectMock });

      const result = await service.findByEmail('John.Doe@Example.com');

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result).toEqual(user);
    });

    it('should convert email to lowercase', async () => {
      const user = mockUser();
      const selectMock = jest.fn().mockResolvedValue(user);
      userModel.findOne.mockReturnValue({ select: selectMock });

      await service.findByEmail('TEST@EXAMPLE.COM');

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should throw NotFoundException when user not found', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      userModel.findOne.mockReturnValue({ select: selectMock });

      await expect(service.findByEmail('notfound@example.com')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('findByMobile', () => {
    it('should return user when found', async () => {
      const user = mockUser();
      const selectMock = jest.fn().mockResolvedValue(user);
      userModel.findOne.mockReturnValue({ select: selectMock });

      const result = await service.findByMobile('9876543210');

      expect(userModel.findOne).toHaveBeenCalledWith({ mobileNumber: '9876543210' });
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      userModel.findOne.mockReturnValue({ select: selectMock });

      await expect(service.findByMobile('1234567890')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const user = {
        ...mockUser(),
        save: jest.fn().mockResolvedValue(true),
      };
      const updatedUser = { ...user, ...validUpdateUserDto };

      userModel.findById.mockResolvedValueOnce(user);

      const selectMock = jest.fn().mockResolvedValue(updatedUser);
      userModel.findById.mockReturnValueOnce({ select: selectMock });

      const result = await service.updateProfile('507f1f77bcf86cd799439011', validUpdateUserDto);

      expect(userModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('507f1f77bcf86cd799439011', validUpdateUserDto),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('should apply all updates to user object', async () => {
      const user = {
        ...mockUser(),
        firstName: 'Old',
        lastName: 'Name',
        save: jest.fn().mockResolvedValue(true),
      };

      userModel.findById.mockResolvedValueOnce(user);

      const selectMock = jest.fn().mockResolvedValue({ ...user, ...validUpdateUserDto });
      userModel.findById.mockReturnValueOnce({ select: selectMock });

      await service.updateProfile('507f1f77bcf86cd799439011', validUpdateUserDto);

      expect(user.save).toHaveBeenCalled();
      expect(selectMock).toHaveBeenCalledWith('-password');
    });
  });

  describe('getSuggestions', () => {
    const userId = '507f1f77bcf86cd799439011';
    const user2Id = '507f1f77bcf86cd799439012';
    const user3Id = '507f1f77bcf86cd799439013';
    const user4Id = '507f1f77bcf86cd799439014';

    it('should return random users excluding self with default limit', async () => {
      connectionModel.find.mockResolvedValue([]);

      const suggestedUsers = [
        { _id: user2Id, firstName: 'Jane', lastName: 'Doe' },
        { _id: user3Id, firstName: 'Bob', lastName: 'Smith' },
      ];

      userModel.aggregate.mockResolvedValue(suggestedUsers);

      const result = await service.getSuggestions(userId, 10);

      expect(connectionModel.find).toHaveBeenCalledWith({
        $or: [
          {
            fromUserId: new Types.ObjectId(userId),
            status: { $in: ['pending', 'accepted', 'blocked'] },
          },
          {
            toUserId: new Types.ObjectId(userId),
            status: { $in: ['pending', 'accepted', 'blocked'] },
          },
        ],
      });
      expect(userModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual(suggestedUsers);
      expect(result.length).toBe(2);
    });

    it('should exclude users with pending sent requests', async () => {
      const connections = [
        {
          fromUserId: new Types.ObjectId(userId),
          toUserId: new Types.ObjectId(user2Id),
          status: 'pending',
        },
      ];

      connectionModel.find.mockResolvedValue(connections);

      const suggestedUsers = [{ _id: user3Id, firstName: 'Bob', lastName: 'Smith' }];
      userModel.aggregate.mockResolvedValue(suggestedUsers);

      const result = await service.getSuggestions(userId, 10);

      expect(result).toEqual(suggestedUsers);
      expect(result.some((u: any) => u._id === user2Id)).toBe(false);
    });

    it('should exclude users with pending received requests', async () => {
      const connections = [
        {
          fromUserId: new Types.ObjectId(user2Id),
          toUserId: new Types.ObjectId(userId),
          status: 'pending',
        },
      ];

      connectionModel.find.mockResolvedValue(connections);

      const suggestedUsers = [{ _id: user3Id, firstName: 'Bob', lastName: 'Smith' }];
      userModel.aggregate.mockResolvedValue(suggestedUsers);

      const result = await service.getSuggestions(userId, 10);

      expect(result).toEqual(suggestedUsers);
      expect(result.some((u: any) => u._id === user2Id)).toBe(false);
    });

    it('should exclude mutual friends (accepted connections)', async () => {
      const connections = [
        {
          fromUserId: new Types.ObjectId(userId),
          toUserId: new Types.ObjectId(user2Id),
          status: 'accepted',
        },
      ];

      connectionModel.find.mockResolvedValue(connections);

      const suggestedUsers = [{ _id: user3Id, firstName: 'Bob', lastName: 'Smith' }];
      userModel.aggregate.mockResolvedValue(suggestedUsers);

      const result = await service.getSuggestions(userId, 10);

      expect(result).toEqual(suggestedUsers);
      expect(result.some((u: any) => u._id === user2Id)).toBe(false);
    });

    it('should exclude blocked users (bidirectional)', async () => {
      const connections = [
        {
          fromUserId: new Types.ObjectId(userId),
          toUserId: new Types.ObjectId(user2Id),
          status: 'blocked',
        },
        {
          fromUserId: new Types.ObjectId(user3Id),
          toUserId: new Types.ObjectId(userId),
          status: 'blocked',
        },
      ];

      connectionModel.find.mockResolvedValue(connections);

      const suggestedUsers = [{ _id: user4Id, firstName: 'Alice', lastName: 'Johnson' }];
      userModel.aggregate.mockResolvedValue(suggestedUsers);

      const result = await service.getSuggestions(userId, 10);

      expect(result).toEqual(suggestedUsers);
      expect(result.some((u: any) => u._id === user2Id)).toBe(false);
      expect(result.some((u: any) => u._id === user3Id)).toBe(false);
    });

    it('should return empty array when all users are excluded', async () => {
      connectionModel.find.mockResolvedValue([]);
      userModel.aggregate.mockResolvedValue([]);

      const result = await service.getSuggestions(userId, 10);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should use $sample for random results', async () => {
      connectionModel.find.mockResolvedValue([]);
      userModel.aggregate.mockResolvedValue([]);

      await service.getSuggestions(userId, 15);

      const aggregateCall = userModel.aggregate.mock.calls[0][0];
      expect(aggregateCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ $sample: { size: 15 } }),
          expect.objectContaining({
            $project: {
              password: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          }),
        ]),
      );
    });

    it('should exclude sensitive and metadata fields from results', async () => {
      connectionModel.find.mockResolvedValue([]);
      userModel.aggregate.mockResolvedValue([]);

      await service.getSuggestions(userId, 10);

      const aggregateCall = userModel.aggregate.mock.calls[0][0];
      const projectStage = aggregateCall.find((stage: any) => stage.$project);
      expect(projectStage).toBeDefined();
      expect(projectStage.$project.password).toBe(0);
      expect(projectStage.$project.createdAt).toBe(0);
      expect(projectStage.$project.updatedAt).toBe(0);
      expect(projectStage.$project.__v).toBe(0);
    });

    it('should respect custom limit parameter', async () => {
      connectionModel.find.mockResolvedValue([]);
      userModel.aggregate.mockResolvedValue([]);

      await service.getSuggestions(userId, 20);

      const aggregateCall = userModel.aggregate.mock.calls[0][0];
      const sampleStage = aggregateCall.find((stage: any) => stage.$sample);
      expect(sampleStage).toBeDefined();
      expect(sampleStage.$sample.size).toBe(20);
    });
  });
});
