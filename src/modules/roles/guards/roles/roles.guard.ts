import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../enums/role.enum';
import { ROLES_KEY } from '../../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // If no role metadata is set, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    //if (!user || !user.roles) {
    //  throw new ForbiddenException('No roles assigned to the user');
    //}

    const userRoles: UserRole[] = user.roles.map((r: any) => r.name);

    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    return hasRequiredRole;
    //const user = context.switchToHttp().getRequest().user;
    //const hasRequiredRole = requiredRoles.some((role)=> user.role === role);
    //return hasRequiredRole;
  }
}
