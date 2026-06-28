/**
 * RS256 JWT strategy ('jwt-rs256') — verifies per-realm RS256 access tokens.
 *
 * Unlike the HS256 'jwt' strategy (one static JWT_SECRET for everyone), this
 * one resolves the verifying key dynamically per request: it reads the token's
 * `kid` (JWT header) and `realm` (payload), then loads that realm's PUBLIC key
 * from realm_keys and verifies the RS256 signature against it. This is what lets
 * each realm sign with its own key pair, Keycloak-style.
 *
 * Protect routes with @UseGuards(AuthGuard('jwt-rs256')).
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthJwtPayload } from '../types/auth-jwtPayload';
import { CurrentUser } from '../types/current-user';
import { AuthService } from '../auth.service';
import { RealmsService } from '../../realms/realms.service';

/** Decode one base64url JWT segment into a plain object (no signature check). */
function decodeSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as T;
}

@Injectable()
export class JwtRs256Strategy extends PassportStrategy(Strategy, 'jwt-rs256') {
  constructor(
    private readonly authService: AuthService,
    // Plain param (not a property): captured by the key resolver below. It is
    // referenced inside the super() options, which run before `this` exists.
    realmsService: RealmsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      // Pick the verifying key per request from the token's kid + realm.
      secretOrKeyProvider: (
        _request: unknown,
        rawJwtToken: string,
        done: (err: unknown, key?: string) => void,
      ): void => {
        void (async () => {
          try {
            const [headerB64, payloadB64] = rawJwtToken.split('.');
            if (!headerB64 || !payloadB64) {
              throw new UnauthorizedException('Malformed token');
            }
            const { kid } = decodeSegment<{ kid?: string }>(headerB64);
            const { realm } = decodeSegment<AuthJwtPayload>(payloadB64);
            if (!kid || !realm) {
              throw new UnauthorizedException('Token missing kid or realm');
            }
            const publicKey = await realmsService.getPublicKeyByKid(realm, kid);
            done(null, publicKey);
          } catch (err) {
            done(err);
          }
        })();
      },
    });
  }

  // passport-jwt has already verified the signature/expiry by the time this
  // runs; turn the payload back into a live user with fresh roles.
  async validate(payload: AuthJwtPayload): Promise<CurrentUser> {
    return this.authService.validateUserRole(payload.sub);
  }
}
