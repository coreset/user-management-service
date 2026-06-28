/**
 * JWT strategy ('jwt') — authorizes every protected request.
 * passport-jwt first verifies the Bearer token's signature (JWT_SECRET) and
 * expiry; then validate() turns payload.sub back into a live CurrentUser with
 * fresh roles from the DB. Used by @UseGuards(AuthGuard('jwt')).
 */
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthJwtPayload } from '../types/auth-jwtPayload';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { CurrentUser } from '../types/current-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
      ignoreExpiration: false,
    });
  }

  async validate(payload: AuthJwtPayload): Promise<CurrentUser> {
    return await this.authService.validateUserRole(payload.sub);
    //return {id:5, roles: [UserRole.USER]};
  }
}
