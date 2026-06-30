import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/role.enum';

/** Metadata key under which required roles are stored; read by RolesGuard. */
export const ROLES_KEY = 'role';

/**
 * Restricts a route or controller to the given roles. Pair with RolesGuard.
 *
 * @example
 *   @Roles([FixedUserRole.SUPER_ADMIN, FixedUserRole.REALM_ADMIN])
 *   @UseGuards(AuthGuard('jwt-rs256'), RolesGuard)
 */
export const Roles = (roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
