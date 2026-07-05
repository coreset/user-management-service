import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealmRole } from './entities/realm-role.entity';
import { UserRealmRole } from './entities/user-realm-role.entity';
import { UsersModule } from '../users/users.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RealmRole, UserRealmRole]),
    UsersModule,
    PermissionModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
