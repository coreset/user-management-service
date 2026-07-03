import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionKey } from '../constants/permission-key.enum';

/**
 * Authorization guard: checks the caller's flattened `permissions` (derived
 * from their roles' assigned Permission rows, see AuthService.validateUserRole)
 * against the permissions required by @Permissions(...) on the route/controller.
 * Registered globally in AuthModule, after the authentication guard.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permission metadata set: allow access.
    }

    const request = context.switchToHttp().getRequest();
    const userPermissions: string[] | undefined = request.user?.permissions;
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );
  }
}
