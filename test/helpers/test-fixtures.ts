export const validSignupDto = {
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  email: 'john.doe@example.com',
  mobileNumber: '9876543210',
  password: 'SecurePass123',
  age: 28,
  gender: 'male' as const,
};

export const validLoginDto = {
  email: 'john.doe@example.com',
  password: 'SecurePass123',
};

export const validLoginWithUsernameDto = {
  username: 'johndoe',
  password: 'SecurePass123',
};

export const validLoginWithMobileDto = {
  mobileNumber: '9876543210',
  password: 'SecurePass123',
};

export const validUpdateUserDto = {
  firstName: 'Jane',
  lastName: 'Smith',
  age: 30,
  gender: 'female' as const,
  bio: "Updated bio with more than 100 characters. This is a comprehensive bio that describes the user's experience and skills in detail. The user is passionate about technology.",
  skills: ['Python', 'Django', 'PostgreSQL'],
  currentPosition: 'Lead Developer',
  currentOrganisation: 'New Company Ltd.',
  location: 'New York, NY',
  githubUrl: 'https://github.com/janesmith',
  linkedinUrl: 'https://linkedin.com/in/janesmith',
  portfolioUrl: 'https://janesmith.dev',
};

export const invalidSignupDto = {
  firstName: 'J',
  lastName: 'D',
  username: 'jd',
  email: 'invalid-email',
  mobileNumber: '123',
  password: '123',
};

export const mockRequest = (overrides = {}) => ({
  user: { id: '507f1f77bcf86cd799439011', username: 'johndoe', email: 'john.doe@example.com' },
  params: {},
  body: {},
  headers: { 'user-agent': 'Mozilla/5.0' },
  ip: '127.0.0.1',
  cookies: { refreshToken: 'mock-refresh-token' },
  ...overrides,
});

export const mockResponse = () => {
  const res: any = {
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};
