import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = request.params.id || request.body.id || user.id;

    if (user.id !== userId) {
      throw new ForbiddenException('You can only access your own profile');
    }

    return true;
  }
}
