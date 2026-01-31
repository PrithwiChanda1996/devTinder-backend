import { Types } from 'mongoose';

export const mockUser = (overrides = {}) => ({
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  email: 'john.doe@example.com',
  mobileNumber: '9876543210',
  password: 'hashedPassword123',
  age: 28,
  gender: 'male',
  bio: 'Experienced full-stack developer with a passion for building scalable applications. Proficient in JavaScript, TypeScript, and modern web frameworks.',
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
  currentPosition: 'Senior Software Engineer',
  currentOrganisation: 'Tech Solutions Inc.',
  location: 'San Francisco, CA',
  githubUrl: 'https://github.com/johndoe',
  linkedinUrl: 'https://linkedin.com/in/johndoe',
  portfolioUrl: 'https://johndoe.dev',
  comparePassword: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue(this),
  toObject: jest.fn().mockReturnThis(),
  ...overrides,
});

export const mockUserDocument = (overrides = {}) => {
  const user = mockUser(overrides);
  return {
    ...user,
    _id: user._id,
    select: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(user),
    toObject: jest.fn().mockReturnValue(user),
  };
};

export const mockRefreshToken = (overrides = {}) => ({
  _id: new Types.ObjectId(),
  token: 'refresh-token-123',
  userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  isRevoked: false,
  userAgent: 'Mozilla/5.0',
  ipAddress: '127.0.0.1',
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

export const createMockModel = (mockData: any) => {
  const model: any = jest.fn().mockImplementation((dto) => ({
    ...mockData,
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockData, ...dto }),
  }));

  model.findOne = jest.fn();
  model.findById = jest.fn();
  model.find = jest.fn();
  model.updateOne = jest.fn();
  model.updateMany = jest.fn();
  model.deleteOne = jest.fn();
  model.deleteMany = jest.fn();
  model.create = jest.fn();
  model.countDocuments = jest.fn();
  model.aggregate = jest.fn();

  return model;
};

export const createMockMongooseModel = (mockData?: any) => {
  const model: any = jest.fn().mockImplementation((dto) => ({
    ...(mockData || {}),
    ...dto,
    save: jest.fn().mockResolvedValue({ ...(mockData || {}), ...dto }),
  }));

  model.findOne = jest.fn();
  model.findById = jest.fn();
  model.find = jest.fn();
  model.findByIdAndDelete = jest.fn();
  model.findByIdAndUpdate = jest.fn();
  model.updateOne = jest.fn();
  model.updateMany = jest.fn();
  model.deleteOne = jest.fn();
  model.deleteMany = jest.fn();
  model.create = jest.fn();
  model.countDocuments = jest.fn();
  model.aggregate = jest.fn();

  return model;
};

export const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({
    id: '507f1f77bcf86cd799439011',
    username: 'johndoe',
    email: 'john.doe@example.com',
  }),
  decode: jest.fn(),
});

export const mockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config = {
      'jwt.accessSecret': 'test-access-secret',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.accessExpiry': '15m',
      'jwt.refreshExpiry': '7d',
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    };
    return config[key];
  }),
});

export const mockConnection = (readyState = 1) => ({
  readyState,
  name: 'codematch',
  host: 'localhost',
  port: 27017,
});

export const mockExecutionContext = (user = null, params = {}, body = {}) => ({
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue({
      user,
      params,
      body,
      headers: { 'user-agent': 'Mozilla/5.0' },
      ip: '127.0.0.1',
      cookies: { refreshToken: 'mock-refresh-token' },
    }),
    getResponse: jest.fn().mockReturnValue({
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }),
  }),
  getClass: jest.fn(),
  getHandler: jest.fn(),
});
