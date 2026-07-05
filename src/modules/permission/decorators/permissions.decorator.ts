import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../constants/permission-key.enum';

/** Metadata key under which required permissions are stored; read by PermissionsGuard. */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Restricts a route or controller to callers holding at least one of the given
 * permissions. Pair with the globally-registered PermissionsGuard.
 *
 * @example
 *   @Permissions([PermissionKey.REALMS_READ])
 *   @Get()
 *   findAll() { ... }
 */
export const Permissions = (permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
