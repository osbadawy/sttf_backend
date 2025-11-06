import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ROLES_KEY,
  IGNORE_ROLES_KEY,
  ALLOW_SELF_ACCESS_KEY,
} from './roles.decorator';
import { UserAccess } from 'src/user/models/user.model';
import type { User } from 'src/user/models/user.model';
import type { UserAccessRequest } from './auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<UserAccess[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const ignoredRoles = this.reflector.getAllAndOverride<UserAccess[]>(
      IGNORE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<UserAccessRequest>();
    const user: User = request.dbUser;

    if (!user) {
      throw new ForbiddenException(
        'UserAccessGuard must be applied before RolesGuard',
      );
    }

    // If ignoreRoles is specified, check if user's role is in the ignore list
    if (ignoredRoles) {
      if (ignoredRoles.includes(user.access)) {
        throw new ForbiddenException(
          'You do not have permission to access this resource',
        );
      }
      // User's role is not ignored, allow access
      return true;
    }

    // If allowedRoles is specified, check if user has one of those roles
    if (allowedRoles) {
      const hasRole = allowedRoles.includes(user.access);

      if (hasRole && user.access !== 'player') {
        // Non-player with required role has access
        return true;
      }

      // Check if player can access their own data
      const allowSelfAccessParam = this.reflector.getAllAndOverride<string>(
        ALLOW_SELF_ACCESS_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (hasRole && user.access === 'player' && allowSelfAccessParam) {
        const paramValue: string | undefined =
          request.params?.[allowSelfAccessParam] ||
          request.query?.[allowSelfAccessParam] ||
          (request.body?.[allowSelfAccessParam] as string | undefined);

        // Allow access if the parameter matches the user's firebase_id or id
        if (paramValue === user.firebase_id || paramValue === user.id) {
          return true;
        }
      }

      if (!hasRole) {
        throw new ForbiddenException(
          'You do not have permission to access this resource',
        );
      }
    }

    // Default: All roles are allowed
    return true;
  }
}
