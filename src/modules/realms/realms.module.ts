import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealmsService } from './realms.service';
import { RealmsController } from './realms.controller';
import { RealmsOidcController } from './realms-oidc.controller';
import { Realm } from './entities/realm.entity';
import { RealmKey } from './entities/realm-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Realm, RealmKey])],
  controllers: [RealmsController, RealmsOidcController],
  providers: [RealmsService],
  exports: [RealmsService],
})
export class RealmsModule {}
