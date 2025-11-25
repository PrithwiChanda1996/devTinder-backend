import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

// eslint-disable-next-line @typescript-eslint/ban-types
function getParamDecoratorFactory(decorator: Function) {
  class TestDecorator {
    public test(@decorator _data: any) {}
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestDecorator, 'test');
  return args[Object.keys(args)[0]].factory;
}

describe('CurrentUser Decorator', () => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  let factory: Function;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    factory = getParamDecoratorFactory(CurrentUser());
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'johndoe',
            email: 'john.doe@example.com',
          },
        }),
      }),
    } as any;
  });

  it('should return entire user object when no data parameter is provided', () => {
    const result = factory(null, mockExecutionContext);

    expect(result).toEqual({
      id: '507f1f77bcf86cd799439011',
      username: 'johndoe',
      email: 'john.doe@example.com',
    });
  });

  it('should return specific user property when data parameter is provided', () => {
    const result = factory('id', mockExecutionContext);

    expect(result).toBe('507f1f77bcf86cd799439011');
  });

  it('should return username when data parameter is "username"', () => {
    const result = factory('username', mockExecutionContext);

    expect(result).toBe('johndoe');
  });

  it('should return email when data parameter is "email"', () => {
    const result = factory('email', mockExecutionContext);

    expect(result).toBe('john.doe@example.com');
  });

  it('should return undefined for non-existent property', () => {
    const result = factory('nonExistentProperty', mockExecutionContext);

    expect(result).toBeUndefined();
  });

  it('should handle undefined user gracefully with data parameter', () => {
    const contextWithNoUser = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: undefined,
        }),
      }),
    } as any;

    const result = factory('id', contextWithNoUser);

    expect(result).toBeUndefined();
  });

  it('should return undefined when user is undefined and no data parameter', () => {
    const contextWithNoUser = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: undefined,
        }),
      }),
    } as any;

    const result = factory(null, contextWithNoUser);

    expect(result).toBeUndefined();
  });

  it('should extract user from request context', () => {
    const getRequestSpy = jest.fn().mockReturnValue({
      user: { id: '123', username: 'testuser' },
    });
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: getRequestSpy,
      }),
    } as any;

    const result = factory(null, context);

    expect(context.switchToHttp).toHaveBeenCalled();
    expect(getRequestSpy).toHaveBeenCalled();
    expect(result).toEqual({ id: '123', username: 'testuser' });
  });
});
