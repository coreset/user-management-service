import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionKey } from '../constants/permission-key.enum';
import { FixedUserRole } from '../../roles/enums/role.enum';

const MASTER_REALM_NAME = process.env.MASTER_REALM_NAME || 'master';

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

    // Route path params (available in guards once the route is matched).
    const { realmName, clientName } = request.params ?? {};
    if (realmName || clientName) {
      console.log(
        `[PermissionsGuard] realmName=${realmName ?? '-'}, clientName=${clientName ?? '-'}`,
      );
    }

    const userRealmName: string | undefined = request.user?.realmName;

    // Master-realm SUPER_ADMIN is the global administrator: skip the permission
    // check for any operation, in any realm. Keyed off the CALLER's own realm
    // (not the URL) so a tenant's SUPER_ADMIN can't gain master privileges.
    const isSuperAdmin = (request.user?.roles ?? []).some(
      (role: { name?: string }) => role.name === FixedUserRole.SUPER_ADMIN,
    );
    if (userRealmName === MASTER_REALM_NAME && isSuperAdmin) {
      return true;
    }

    // Tenant isolation: a caller may only act within their own realm. Block when
    // the target realm in the path differs from the caller's realm.
    if (realmName && realmName !== userRealmName) {
      return false;
    }

    const userPermissions: string[] | undefined = request.user?.permissions;
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );
  }
}
