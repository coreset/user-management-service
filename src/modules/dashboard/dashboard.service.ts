import { Injectable, NotFoundException } from '@nestjs/common';
import { RealmsService } from '../realms/realms.service';
import { UsersService } from '../users/users.service';
import { RealmRolesService } from '../roles/services/realm-roles.service';
import { ClientRolesService } from '../roles/services/client-roles.service';
import { PermissionService } from '../permission/permission.service';
import { ClientsService } from '../clients/clients.service';

/**
 * Aggregates counts from the other modules into a single realm-overview
 * dashboard. Owns no data of its own — every figure is delegated to the
 * module that actually owns it (kept in sync automatically as those modules evolve).
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly realmsService: RealmsService,
    private readonly usersService: UsersService,
    private readonly realmRolesService: RealmRolesService,
    private readonly clientRolesService: ClientRolesService,
    private readonly permissionService: PermissionService,
    private readonly clientsService: ClientsService,
  ) {}

  async getStats(realmName: string) {
    const realm = await this.realmsService.findByName(realmName);
    if (!realm) {
      throw new NotFoundException(`Realm '${realmName}' not found`);
    }

    const [users, totalRealmRoles, totalClientRoles, totalPermissions, clients] =
      await Promise.all([
        this.usersService.countByRealm(realm.id),
        this.realmRolesService.countByRealm(realm.id),
        this.clientRolesService.countByRealm(realm.id),
        this.permissionService.countByRealm(realm.id),
        this.clientsService.countByRealm(realm.id),
      ]);

    return {
      realmName: realm.realmName,
      totalUsers: users.total,
      activeUsers: users.active,
      inactiveUsers: users.inactive,
      totalRealmRoles,
      totalClientRoles,
      totalPermissions,
      totalClients: clients.total,
      activeClients: clients.active,
    };
  }
}
