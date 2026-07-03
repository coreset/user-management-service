/**
 * RS256 JWT guard ('JwtRs256Guard') — a Passport-free equivalent of the
 * 'jwt-rs256' strategy. It verifies per-realm RS256 access tokens by reading the
 * token's `kid` (header) + `realm` (payload), loading that realm's PUBLIC key
 * from realm_keys, and verifying the RS256 signature against it.
 *
 * Behaviour is identical to JwtRs256Strategy, so the two are interchangeable:
 *   @UseGuards(AuthGuard('jwt-rs256'))   // Passport strategy
 *   @UseGuards(JwtRs256Guard)            // this guard
 *
 * On success it mirrors Passport by attaching the resolved user to `req.user`.
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthJwtPayload } from '../types/auth-jwtPayload';
import { CurrentUser } from '../types/current-user';
import { AuthService } from '../auth.service';
import { RealmsService } from '../../realms/realms.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtRs256Guard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly realmsService: RealmsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Routes marked @Public() skip authentication entirely.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractBearerToken(request);
    const { kid, realm } = this.readKidAndRealm(token);
    const publicKey = await this.resolvePublicKey(realm, kid);
    const payload = this.verify(token, publicKey);
    console.log("request payload >>>", payload);
    const user = await this.authService.validateUserRole(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or not authorized');
    }

    // Mirror Passport: expose the authenticated user on the request.
    (request as Request & { user?: CurrentUser }).user = user;
    return true;
  }

  /** Pull a single Bearer token out of the Authorization header. */
  private extractBearerToken(request: Request): string {
    const header = request.headers.authorization;
    if (typeof header !== 'string' || header.length === 0) {
      throw new UnauthorizedException('Missing Authorization header');
    }
    const match = /^Bearer\s+(\S+)\s*$/i.exec(header.trim());
    if (!match) {
      throw new UnauthorizedException('Malformed Authorization header');
    }
    return match[1];
  }

  /**
   * Read kid/realm from the *unverified* token, only to select the key.
   * Uses jwt.decode (no signature check) which safely parses all three segments
   * in one pass and returns null on anything malformed.
   */
  private readKidAndRealm(token: string): { kid: string; realm: string } {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded.payload === 'string') {
      throw new UnauthorizedException('Malformed token');
    }
    const kid = decoded.header.kid;
    const { realm } = decoded.payload as Partial<AuthJwtPayload>;
    if (!kid || !realm) {
      throw new UnauthorizedException('Token missing kid or realm');
    }
    return { kid, realm };
  }

  private async resolvePublicKey(realm: string, kid: string): Promise<string> {
    let publicKey: string | undefined;
    try {
      publicKey = await this.realmsService.getPublicKeyByKid(realm, kid);
    } catch {
      throw new UnauthorizedException('Unable to resolve signing key');
    }
    if (!publicKey) {
      throw new UnauthorizedException('Unknown signing key');
    }
    return publicKey;
  }

  /** Verify signature + standard claims, pinned to RS256. */
  private verify(token: string, publicKey: string): AuthJwtPayload {
    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      if (err instanceof jwt.NotBeforeError) {
        throw new UnauthorizedException('Token not yet valid');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Token verification failed');
    }

    if (typeof decoded === 'string' || !decoded.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return decoded as AuthJwtPayload;
  }
}
