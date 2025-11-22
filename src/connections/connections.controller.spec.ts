import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { ConnectionStatus } from './entities/connection.entity';

describe('ConnectionsController', () => {
  let controller: ConnectionsController;
  let service: ConnectionsService;

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockTargetUserId = '507f1f77bcf86cd799439012';

  const mockConnectionsService = {
    sendConnectionRequest: jest.fn(),
    acceptConnection: jest.fn(),
    rejectConnection: jest.fn(),
    cancelRequest: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    getReceivedRequests: jest.fn(),
    getSentRequests: jest.fn(),
    getConnections: jest.fn(),
    getConnectionStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConnectionsController],
      providers: [
        {
          provide: ConnectionsService,
          useValue: mockConnectionsService,
        },
      ],
    }).compile();

    controller = module.get<ConnectionsController>(ConnectionsController);
    service = module.get<ConnectionsService>(ConnectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendConnectionRequest', () => {
    it('should send a connection request successfully', async () => {
      const mockConnection = {
        _id: 'connection123',
        fromUserId: mockUserId,
        toUserId: mockTargetUserId,
        status: ConnectionStatus.PENDING,
      };

      mockConnectionsService.sendConnectionRequest.mockResolvedValue(
        mockConnection,
      );

      const result = await controller.sendConnectionRequest(mockUserId, {
        toUserId: mockTargetUserId,
      });

      expect(result.message).toBe('Connection request sent successfully');
      expect(result.data).toEqual(mockConnection);
      expect(service.sendConnectionRequest).toHaveBeenCalledWith(
        mockUserId,
        mockTargetUserId,
      );
    });
  });

  describe('acceptConnection', () => {
    it('should accept a connection request successfully', async () => {
      const mockConnection = {
        _id: 'connection123',
        fromUserId: mockTargetUserId,
        toUserId: mockUserId,
        status: ConnectionStatus.ACCEPTED,
      };

      mockConnectionsService.acceptConnection.mockResolvedValue(
        mockConnection,
      );

      const result = await controller.acceptConnection(
        mockUserId,
        'connection123',
      );

      expect(result.message).toBe('Connection request accepted successfully');
      expect(result.data).toEqual(mockConnection);
      expect(service.acceptConnection).toHaveBeenCalledWith(
        'connection123',
        mockUserId,
      );
    });
  });

  describe('rejectConnection', () => {
    it('should reject a connection request successfully', async () => {
      const mockConnection = {
        _id: 'connection123',
        fromUserId: mockTargetUserId,
        toUserId: mockUserId,
        status: ConnectionStatus.REJECTED,
      };

      mockConnectionsService.rejectConnection.mockResolvedValue(
        mockConnection,
      );

      const result = await controller.rejectConnection(
        mockUserId,
        'connection123',
      );

      expect(result.message).toBe('Connection request rejected successfully');
      expect(result.data).toEqual(mockConnection);
      expect(service.rejectConnection).toHaveBeenCalledWith(
        'connection123',
        mockUserId,
      );
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a connection request successfully', async () => {
      mockConnectionsService.cancelRequest.mockResolvedValue(undefined);

      const result = await controller.cancelRequest(mockUserId, 'connection123');

      expect(result.message).toBe('Connection request cancelled successfully');
      expect(service.cancelRequest).toHaveBeenCalledWith(
        'connection123',
        mockUserId,
      );
    });
  });

  describe('blockUser', () => {
    it('should block a user successfully', async () => {
      mockConnectionsService.blockUser.mockResolvedValue({
        _id: 'connection123',
        fromUserId: mockUserId,
        toUserId: mockTargetUserId,
        status: ConnectionStatus.BLOCKED,
      });

      const result = await controller.blockUser(mockUserId, mockTargetUserId);

      expect(result.message).toBe('User blocked successfully');
      expect(service.blockUser).toHaveBeenCalledWith(
        mockUserId,
        mockTargetUserId,
      );
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user successfully', async () => {
      mockConnectionsService.unblockUser.mockResolvedValue(undefined);

      const result = await controller.unblockUser(mockUserId, mockTargetUserId);

      expect(result.message).toBe('User unblocked successfully');
      expect(service.unblockUser).toHaveBeenCalledWith(
        mockUserId,
        mockTargetUserId,
      );
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
        {
          _id: 'connection2',
          fromUserId: '507f1f77bcf86cd799439013',
          toUserId: mockUserId,
          status: ConnectionStatus.PENDING,
        },
      ];

      mockConnectionsService.getReceivedRequests.mockResolvedValue(
        mockRequests,
      );

      const result = await controller.getReceivedRequests(mockUserId);

      expect(result.message).toBe(
        'Received connection requests retrieved successfully',
      );
      expect(result.count).toBe(2);
      expect(result.data).toEqual(mockRequests);
      expect(service.getReceivedRequests).toHaveBeenCalledWith(
        mockUserId,
      );
    });

    it('should return empty array when no requests', async () => {
      mockConnectionsService.getReceivedRequests.mockResolvedValue([]);

      const result = await controller.getReceivedRequests(mockUserId);

      expect(result.count).toBe(0);
      expect(result.data).toEqual([]);
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

      mockConnectionsService.getSentRequests.mockResolvedValue(mockRequests);

      const result = await controller.getSentRequests(mockUserId);

      expect(result.message).toBe(
        'Sent connection requests retrieved successfully',
      );
      expect(result.count).toBe(1);
      expect(result.data).toEqual(mockRequests);
      expect(service.getSentRequests).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getConnections', () => {
    it('should return all connections', async () => {
      const mockConnections = [
        {
          _id: 'connection1',
          fromUserId: mockUserId,
          toUserId: mockTargetUserId,
          status: ConnectionStatus.ACCEPTED,
        },
        {
          _id: 'connection2',
          fromUserId: '507f1f77bcf86cd799439013',
          toUserId: mockUserId,
          status: ConnectionStatus.ACCEPTED,
        },
      ];

      mockConnectionsService.getConnections.mockResolvedValue(
        mockConnections,
      );

      const result = await controller.getConnections(mockUserId);

      expect(result.message).toBe('Connections retrieved successfully');
      expect(result.count).toBe(2);
      expect(result.data).toEqual(mockConnections);
      expect(service.getConnections).toHaveBeenCalledWith(mockUserId);
    });

    it('should return empty array when no connections', async () => {
      mockConnectionsService.getConnections.mockResolvedValue([]);

      const result = await controller.getConnections(mockUserId);

      expect(result.count).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status for pending sent request', async () => {
      const mockStatus = {
        status: ConnectionStatus.PENDING,
        connectionId: 'connection123',
        message: 'Connection request sent',
      };

      mockConnectionsService.getConnectionStatus.mockResolvedValue(mockStatus);

      const result = await controller.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result).toEqual(mockStatus);
      expect(service.getConnectionStatus).toHaveBeenCalledWith(
        mockUserId,
        mockTargetUserId,
      );
    });

    it('should return connection status for pending received request', async () => {
      const mockStatus = {
        status: ConnectionStatus.PENDING,
        connectionId: 'connection123',
        message: 'Connection request received',
      };

      mockConnectionsService.getConnectionStatus.mockResolvedValue(mockStatus);

      const result = await controller.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result).toEqual(mockStatus);
    });

    it('should return connection status for accepted connection', async () => {
      const mockStatus = {
        status: ConnectionStatus.ACCEPTED,
        connectionId: 'connection123',
        message: 'Connected',
      };

      mockConnectionsService.getConnectionStatus.mockResolvedValue(mockStatus);

      const result = await controller.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result).toEqual(mockStatus);
    });

    it('should return null status when no connection exists', async () => {
      const mockStatus = {
        status: null,
        connectionId: null,
        message: 'No connection exists',
      };

      mockConnectionsService.getConnectionStatus.mockResolvedValue(mockStatus);

      const result = await controller.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result).toEqual(mockStatus);
    });

    it('should return blocked status', async () => {
      const mockStatus = {
        status: ConnectionStatus.BLOCKED,
        connectionId: 'connection123',
        message: 'User blocked',
      };

      mockConnectionsService.getConnectionStatus.mockResolvedValue(mockStatus);

      const result = await controller.getConnectionStatus(
        mockUserId,
        mockTargetUserId,
      );

      expect(result).toEqual(mockStatus);
    });
  });
});

