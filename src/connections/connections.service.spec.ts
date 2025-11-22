import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { Connection, ConnectionStatus } from './entities/connection.entity';
import { UsersService } from '../users/users.service';
import { createMockMongooseModel } from '../../test/helpers/mock-factories';

describe('ConnectionsService', () => {
  let service: ConnectionsService;
  let connectionModel: any;
  let usersService: any;

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockTargetUserId = '507f1f77bcf86cd799439012';
  const mockConnectionId = '507f1f77bcf86cd799439013';

  beforeEach(async () => {
    connectionModel = createMockMongooseModel();
    usersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionsService,
        {
          provide: getModelToken(Connection.name),
          useValue: connectionModel,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    service = module.get<ConnectionsService>(ConnectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendConnectionRequest', () => {
    it('should successfully send a connection request', async () => {
      const mockConnection = {
        _id: 'connection123',
        fromUserId: mockUserId,
        toUserId: mockTargetUserId,
        status: ConnectionStatus.PENDING,
        save: jest.fn().mockResolvedValue({
          _id: 'connection123',
          fromUserId: mockUserId,
          toUserId: mockTargetUserId,
          status: ConnectionStatus.PENDING,
        }),
      };

      usersService.findById.mockResolvedValue({ _id: mockUserId });
      connectionModel.findOne.mockResolvedValue(null);
      connectionModel.mockReturnValue(mockConnection);

      const result = await service.sendConnectionRequest(
        mockUserId,
        mockTargetUserId,
      );

      expect(usersService.findById).toHaveBeenCalledWith(mockUserId);
      expect(usersService.findById).toHaveBeenCalledWith(mockTargetUserId);
      expect(connectionModel.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when sending to self', async () => {
      await expect(
        service.sendConnectionRequest(mockUserId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if pending request already exists', async () => {
      const existingConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.PENDING,
      };

      usersService.findById.mockResolvedValue({ _id: mockUserId });
      connectionModel.findOne.mockResolvedValue(existingConnection);

      await expect(
        service.sendConnectionRequest(mockUserId, mockTargetUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if reverse pending request exists', async () => {
      const existingConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockTargetUserId },
        toUserId: { toString: () => mockUserId },
        status: ConnectionStatus.PENDING,
      };

      usersService.findById.mockResolvedValue({ _id: mockUserId });
      connectionModel.findOne.mockResolvedValue(existingConnection);

      await expect(
        service.sendConnectionRequest(mockUserId, mockTargetUserId),
      ).rejects.toThrow(
        new ConflictException(
          'User has already sent you a request. Please accept/reject it first',
        ),
      );
    });

    it('should throw ConflictException if already connected', async () => {
      const existingConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.ACCEPTED,
      };

      usersService.findById.mockResolvedValue({ _id: mockUserId });
      connectionModel.findOne.mockResolvedValue(existingConnection);

      await expect(
        service.sendConnectionRequest(mockUserId, mockTargetUserId),
      ).rejects.toThrow(new ConflictException('Already connected'));
    });

    it('should throw ForbiddenException if user is blocked', async () => {
      const existingConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.BLOCKED,
      };

      usersService.findById.mockResolvedValue({ _id: mockUserId });
      connectionModel.findOne.mockResolvedValue(existingConnection);

      await expect(
        service.sendConnectionRequest(mockUserId, mockTargetUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow resending after rejection', async () => {
      const existingConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.REJECTED,
      };

      const mockConnection = {
        save: jest.fn().mockResolvedValue({
          _id: 'connection456',
          fromUserId: mockUserId,
          toUserId: mockTargetUserId,
          status: ConnectionStatus.PENDING,
        }),
      };

      usersService.findById.mockResolvedValue({ _id: mockUserId });
      connectionModel.findOne.mockResolvedValue(existingConnection);
      connectionModel.findByIdAndDelete.mockResolvedValue(existingConnection);
      connectionModel.mockReturnValue(mockConnection);

      const result = await service.sendConnectionRequest(
        mockUserId,
        mockTargetUserId,
      );

      expect(connectionModel.findByIdAndDelete).toHaveBeenCalledWith(
        'connection123',
      );
      expect(result).toBeDefined();
    });
  });

  describe('acceptConnection', () => {
    it('should successfully accept a connection request', async () => {
      const mockConnection = {
        _id: mockConnectionId,
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.PENDING,
        save: jest.fn().mockResolvedValue({
          _id: mockConnectionId,
          status: ConnectionStatus.ACCEPTED,
        }),
      };

      connectionModel.findById.mockResolvedValue(mockConnection);
      connectionModel.findOne.mockResolvedValue(null); // No block

      const result = await service.acceptConnection(
        mockConnectionId,
        mockTargetUserId,
      );

      expect(mockConnection.save).toHaveBeenCalled();
      expect(result.status).toBe(ConnectionStatus.ACCEPTED);
    });

    it('should throw BadRequestException for invalid connection ID', async () => {
      await expect(
        service.acceptConnection('invalid-id', mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if connection does not exist', async () => {
      connectionModel.findById.mockResolvedValue(null);

      await expect(
        service.acceptConnection(mockConnectionId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the receiver', async () => {
      const mockConnection = {
        _id: mockConnectionId,
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.PENDING,
      };

      connectionModel.findById.mockResolvedValue(mockConnection);

      await expect(
        service.acceptConnection(mockConnectionId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if status is not pending', async () => {
      const mockConnection = {
        _id: mockConnectionId,
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.ACCEPTED,
      };

      connectionModel.findById.mockResolvedValue(mockConnection);

      await expect(
        service.acceptConnection(mockConnectionId, mockTargetUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectConnection', () => {
    it('should successfully reject a connection request', async () => {
      const mockConnection = {
        _id: mockConnectionId,
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.PENDING,
        save: jest.fn().mockResolvedValue({
          _id: mockConnectionId,
          status: ConnectionStatus.REJECTED,
        }),
      };

      connectionModel.findById.mockResolvedValue(mockConnection);

      const result = await service.rejectConnection(
        mockConnectionId,
        mockTargetUserId,
      );

      expect(result.status).toBe(ConnectionStatus.REJECTED);
    });

    it('should throw ForbiddenException if user is not the receiver', async () => {
      const mockConnection = {
        _id: mockConnectionId,
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.PENDING,
      };

      connectionModel.findById.mockResolvedValue(mockConnection);

      await expect(
        service.rejectConnection(mockConnectionId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelRequest', () => {
    it('should successfully cancel a connection request', async () => {
      const mockConnection = {
        _id: mockConnectionId,
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.PENDING,
      };

      connectionModel.findById.mockResolvedValue(mockConnection);
      connectionModel.findByIdAndDelete.mockResolvedValue(mockConnection);

      await service.cancelRequest(mockConnectionId, mockUserId);

      expect(connectionModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockConnectionId,
      );
    });

    it('should throw BadRequestException for invalid connection ID', async () => {
      await expect(
        service.cancelRequest('invalid-id', mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if connection does not exist', async () => {
      connectionModel.findById.mockResolvedValue(null);

      await expect(
        service.cancelRequest(mockConnectionId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      const mockConnection = {
        _id: mockConnectionId,
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.PENDING,
      };

      connectionModel.findById.mockResolvedValue(mockConnection);

      await expect(
        service.cancelRequest(mockConnectionId, mockTargetUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if status is not pending', async () => {
      const mockConnection = {
        _id: mockConnectionId,
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.ACCEPTED,
      };

      connectionModel.findById.mockResolvedValue(mockConnection);

      await expect(
        service.cancelRequest(mockConnectionId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('blockUser', () => {
    it('should successfully block a user', async () => {
      const mockConnection = {
        save: jest.fn().mockResolvedValue({
          _id: 'connection123',
          fromUserId: mockUserId,
          toUserId: mockTargetUserId,
          status: ConnectionStatus.BLOCKED,
        }),
      };

      usersService.findById.mockResolvedValue({ _id: mockTargetUserId });
      connectionModel.findOne.mockResolvedValue(null);
      connectionModel.mockReturnValue(mockConnection);

      const result = await service.blockUser(mockUserId, mockTargetUserId);

      expect(result).toBeDefined();
      expect(mockConnection.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when blocking self', async () => {
      await expect(service.blockUser(mockUserId, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if user is already blocked', async () => {
      const existingConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.BLOCKED,
      };

      usersService.findById.mockResolvedValue({ _id: mockTargetUserId });
      connectionModel.findOne.mockResolvedValue(existingConnection);

      await expect(
        service.blockUser(mockUserId, mockTargetUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should delete existing connection before blocking', async () => {
      const existingConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.ACCEPTED,
      };

      const mockConnection = {
        save: jest.fn().mockResolvedValue({
          _id: 'connection456',
          fromUserId: mockUserId,
          toUserId: mockTargetUserId,
          status: ConnectionStatus.BLOCKED,
        }),
      };

      usersService.findById.mockResolvedValue({ _id: mockTargetUserId });
      connectionModel.findOne.mockResolvedValue(existingConnection);
      connectionModel.findByIdAndDelete.mockResolvedValue(existingConnection);
      connectionModel.mockReturnValue(mockConnection);

      await service.blockUser(mockUserId, mockTargetUserId);

      expect(connectionModel.findByIdAndDelete).toHaveBeenCalledWith(
        'connection123',
      );
    });
  });

  describe('unblockUser', () => {
    it('should successfully unblock a user', async () => {
      const mockConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.BLOCKED,
      };

      connectionModel.findOne.mockResolvedValue(mockConnection);
      connectionModel.findByIdAndDelete.mockResolvedValue(mockConnection);

      await service.unblockUser(mockUserId, mockTargetUserId);

      expect(connectionModel.findByIdAndDelete).toHaveBeenCalledWith(
        'connection123',
      );
    });

    it('should throw BadRequestException when unblocking self', async () => {
      await expect(
        service.unblockUser(mockUserId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if no blocked connection found', async () => {
      connectionModel.findOne.mockResolvedValue(null);

      await expect(
        service.unblockUser(mockUserId, mockTargetUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReceivedRequests', () => {
    it('should return received connection requests', async () => {
      const mockRequests = [
        {
          _id: 'connection1',
          fromUserId: mockTargetUserId,
          toUserId: mockUserId,
          status: ConnectionStatus.PENDING,
        },
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockRequests),
      };

      connectionModel.find.mockReturnValue(mockQuery);

      const result = await service.getReceivedRequests(mockUserId);

      expect(result).toEqual(mockRequests);
      expect(mockQuery.populate).toHaveBeenCalledWith(
        'fromUserId',
        'username firstName lastName profilePhoto',
      );
    });
  });

  describe('getSentRequests', () => {
    it('should return sent connection requests', async () => {
      const mockRequests = [
        {
          _id: 'connection1',
          fromUserId: mockUserId,
          toUserId: mockTargetUserId,
          status: ConnectionStatus.PENDING,
        },
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockRequests),
      };

      connectionModel.find.mockReturnValue(mockQuery);

      const result = await service.getSentRequests(mockUserId);

      expect(result).toEqual(mockRequests);
    });
  });

  describe('getConnections', () => {
    it('should return all accepted connections', async () => {
      const mockConnections = [
        {
          _id: 'connection1',
          fromUserId: mockUserId,
          toUserId: mockTargetUserId,
          status: ConnectionStatus.ACCEPTED,
        },
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockConnections),
      };

      connectionModel.find.mockReturnValue(mockQuery);

      const result = await service.getConnections(mockUserId);

      expect(result).toEqual(mockConnections);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return null status when checking with self', async () => {
      const result = await service.getConnectionStatus(mockUserId, mockUserId);

      expect(result.status).toBeNull();
      expect(result.message).toBe('Cannot check connection with yourself');
    });

    it('should return null status when no connection exists', async () => {
      connectionModel.findOne.mockResolvedValue(null);

      const result = await service.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result.status).toBeNull();
      expect(result.message).toBe('No connection exists');
    });

    it('should return correct status for pending request sent', async () => {
      const mockConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.PENDING,
      };

      connectionModel.findOne.mockResolvedValue(mockConnection);

      const result = await service.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result.status).toBe(ConnectionStatus.PENDING);
      expect(result.message).toBe('Connection request sent');
    });

    it('should return correct status for pending request received', async () => {
      const mockConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockTargetUserId },
        toUserId: { toString: () => mockUserId },
        status: ConnectionStatus.PENDING,
      };

      connectionModel.findOne.mockResolvedValue(mockConnection);

      const result = await service.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result.status).toBe(ConnectionStatus.PENDING);
      expect(result.message).toBe('Connection request received');
    });

    it('should return correct status for accepted connection', async () => {
      const mockConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.ACCEPTED,
      };

      connectionModel.findOne.mockResolvedValue(mockConnection);

      const result = await service.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result.status).toBe(ConnectionStatus.ACCEPTED);
      expect(result.message).toBe('Connected');
    });

    it('should return correct status when user blocked another', async () => {
      const mockConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockUserId },
        toUserId: { toString: () => mockTargetUserId },
        status: ConnectionStatus.BLOCKED,
      };

      connectionModel.findOne.mockResolvedValue(mockConnection);

      const result = await service.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result.status).toBe(ConnectionStatus.BLOCKED);
      expect(result.message).toBe('User blocked');
    });

    it('should return correct status when blocked by user', async () => {
      const mockConnection = {
        _id: 'connection123',
        fromUserId: { toString: () => mockTargetUserId },
        toUserId: { toString: () => mockUserId },
        status: ConnectionStatus.BLOCKED,
      };

      connectionModel.findOne.mockResolvedValue(mockConnection);

      const result = await service.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result.status).toBe(ConnectionStatus.BLOCKED);
      expect(result.message).toBe('Blocked by user');
    });
  });

  describe('checkBlockStatus', () => {
    it('should return true if block exists in either direction', async () => {
      const mockConnection = {
        status: ConnectionStatus.BLOCKED,
      };

      connectionModel.findOne.mockResolvedValue(mockConnection);

      const result = await service.checkBlockStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result).toBe(true);
    });

    it('should return false if no block exists', async () => {
      connectionModel.findOne.mockResolvedValue(null);

      const result = await service.checkBlockStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result).toBe(false);
    });
  });
});

