import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from '../roles/guards/roles/roles.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRs256Strategy } from './strategies/jwt-rs256.strategy';
import { JwtRs256Guard } from './guards/jwt-rs256.guard';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserVerificationIdentifier } from './entities/user-verification-identifier.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserSession } from './entities/user-session.entity';
import { PasswordHistory } from '../users/entities/password-history.entity';
import { RealmsModule } from '../realms/realms.module';
import { AuditModule } from '../../common/audit/audit.module';
import { User } from '../users/entities/user.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // import ConfigModule (already global, but still good practice)
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRE_IN') },
      }),
    }),
    TypeOrmModule.forFeature([
      RefreshToken,
      UserVerificationIdentifier,
      UserSession,
      PasswordHistory,
      User,
    ]),
    SettingsModule,
    RealmsModule, // provides RealmsService for RS256 signing + key lookup
    AuditModule, // provides AuditService for auth-event logging
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRs256Strategy,
    JwtRs256Guard,
    RefreshJwtStrategy,
    GoogleStrategy,
    // Global guards — order matters: authenticate first (sets req.user), then
    // authorize. Routes opt out of auth with @Public(); RolesGuard only enforces
    // when a route declares @Roles([...]).
    { provide: APP_GUARD, useClass: JwtRs256Guard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [JwtModule, JwtStrategy, JwtRs256Guard],
})

export class AuthModule {}
