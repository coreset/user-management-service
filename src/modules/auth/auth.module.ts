import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRs256Strategy } from './strategies/jwt-rs256.strategy';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserVerificationIdentifier } from './entities/user-verification-identifier.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserSession } from './entities/user-session.entity';
import { PasswordHistory } from '../users/entities/password-history.entity';
import { RealmsModule } from '../realms/realms.module';
import { AuditModule } from '../../common/audit/audit.module';

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
    ]),
    RealmsModule, // provides RealmsService for RS256 signing + key lookup
    AuditModule, // provides AuditService for auth-event logging
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRs256Strategy,
    RefreshJwtStrategy,
    GoogleStrategy,
  ],
  exports: [JwtModule, JwtStrategy],
})

export class AuthModule {}
