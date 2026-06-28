import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from './entities/client.entity';
import { ClientRole } from './entities/client-role.entity';
import { UserClientRole } from './entities/user-client-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, ClientRole, UserClientRole])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
