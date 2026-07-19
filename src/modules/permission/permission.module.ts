import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController, MeController } from './permission.controller';
import { Permission } from './entities/permission.entity';
import { Realm } from '../realms/entities/realm.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Realm]),
  ],
  controllers: [PermissionController, MeController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
