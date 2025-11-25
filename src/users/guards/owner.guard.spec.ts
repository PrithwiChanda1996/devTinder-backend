import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { OwnerGuard } from './owner.guard';

describe('OwnerGuard', () => {
  let guard: OwnerGuard;

  beforeEach(() => {
    guard = new OwnerGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when user.id matches params.id', () => {
      const userId = '507f1f77bcf86cd799439011';
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: userId },
            params: { id: userId },
            body: {},
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user.id matches body.id', () => {
      const userId = '507f1f77bcf86cd799439011';
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: userId },
            params: {},
            body: { id: userId },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when no id in params/body (uses user.id)', () => {
      const userId = '507f1f77bcf86cd799439011';
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: userId },
            params: {},
            body: {},
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user.id does not match params.id', () => {
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: '507f1f77bcf86cd799439011' },
            params: { id: '507f1f77bcf86cd799439099' },
            body: {},
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('You can only access your own profile'),
      );
    });

    it('should throw ForbiddenException when user.id does not match body.id', () => {
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: '507f1f77bcf86cd799439011' },
            params: {},
            body: { id: '507f1f77bcf86cd799439099' },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('You can only access your own profile'),
      );
    });

    it('should prioritize params.id over body.id', () => {
      const userId = '507f1f77bcf86cd799439011';
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: userId },
            params: { id: userId },
            body: { id: '507f1f77bcf86cd799439099' },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should use body.id when params.id is not present', () => {
      const userId = '507f1f77bcf86cd799439011';
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: userId },
            params: {},
            body: { id: userId },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
