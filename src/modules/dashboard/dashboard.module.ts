import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { RealmsModule } from '../realms/realms.module';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { PermissionModule } from '../permission/permission.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    RealmsModule,
    UsersModule,
    RolesModule,
    PermissionModule,
    ClientsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
