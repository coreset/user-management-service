import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealmRolesService } from './services/realm-roles.service';
import { ClientRolesService } from './services/client-roles.service';
import { RealmRolesController } from './controllers/realm-roles.controller';
import { ClientRolesController } from './controllers/client-roles.controller';
import { RealmRole } from './entities/realm-role.entity';
import { UserRealmRole } from './entities/user-realm-role.entity';
import { ClientRole } from '../clients/entities/client-role.entity';
import { UserClientRole } from '../clients/entities/user-client-role.entity';
import { Permission } from '../permission/entities/permission.entity';
import { UsersModule } from '../users/users.module';
import { PermissionModule } from '../permission/permission.module';
import { RealmsModule } from '../realms/realms.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RealmRole,
      UserRealmRole,
      ClientRole,
      UserClientRole,
      Permission,
    ]),
    UsersModule,
    PermissionModule,
    RealmsModule,
    ClientsModule,
  ],
  controllers: [
    RealmRolesController,
    ClientRolesController,
  ],
  providers: [RealmRolesService, ClientRolesService],
  exports: [RealmRolesService, ClientRolesService],
})
export class RolesModule {}
