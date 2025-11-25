import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should call super.canActivate', async () => {
      const context = {} as ExecutionContext;
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      );
      superCanActivateSpy.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(superCanActivateSpy).toHaveBeenCalledWith(context);

      superCanActivateSpy.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const user = { id: '123', username: 'testuser', email: 'test@example.com' };

      const result = guard.handleRequest(null, user, null);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException with TOKEN_EXPIRED code when token is expired', () => {
      const info = { name: 'TokenExpiredError' };

      expect(() => guard.handleRequest(null, null, info)).toThrow(
        new UnauthorizedException({
          message: 'Access token has expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
        }),
      );
    });

    it('should throw UnauthorizedException when user is not found', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        new UnauthorizedException('Invalid access token'),
      );
    });

    it('should throw the error if error is provided', () => {
      const error = new Error('Custom error');

      expect(() => guard.handleRequest(error, null, null)).toThrow(error);
    });

    it('should throw UnauthorizedException when user is false', () => {
      expect(() => guard.handleRequest(null, false, null)).toThrow(
        new UnauthorizedException('Invalid access token'),
      );
    });

    it('should throw error even if user is present when error exists', () => {
      const error = new Error('Custom error');
      const user = { id: '123', username: 'testuser' };

      expect(() => guard.handleRequest(error, user, null)).toThrow(error);
    });
  });
});
