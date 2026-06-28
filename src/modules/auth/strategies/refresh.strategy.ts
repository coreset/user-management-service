/**
 * Refresh JWT strategy ('refresh-jwt') — validates the refresh token.
 * Used by /auth/refresh and /auth/signout. Verifies the Bearer token against
 * REFRESH_JWT_SECRET, then checks it against the hashed copy stored in the DB
 * (validateRefreshToken) so revoked/rotated tokens are rejected.
 */
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthJwtPayload } from '../types/auth-jwtPayload';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(
    private configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('REFRESH_JWT_SECRET') || 'defaultSecret',
      ignoreExpiration: false,
      passReqToCallback: true, // pass request object to the "validate" function
    });
  }

  async validate(req: Request, payload: AuthJwtPayload) {
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();
    const userId = payload.sub;
    if(refreshToken && userId && (await this.authService.validateRefreshToken(userId, refreshToken)) ) {
      return { id: payload.sub };
    } else {
      throw new UnauthorizedException('Invalid Refresh Token');
    }
  }
}
