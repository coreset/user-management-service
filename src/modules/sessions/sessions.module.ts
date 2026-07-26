import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { UserSession } from '../auth/entities/user-session.entity';
import { Realm } from '../realms/entities/realm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSession, Realm])],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
