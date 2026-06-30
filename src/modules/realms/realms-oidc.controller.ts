import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RealmsService } from './realms.service';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Public OIDC-style endpoints for a realm. Intentionally NOT guarded — external
 * services must be able to fetch a realm's public keys to verify access tokens.
 * Kept separate from RealmsController (which is SUPER_ADMIN-only) so the auth
 * guards there don't apply here.
 */
@ApiTags('oidc')
@Controller('realms')
export class RealmsOidcController {
  constructor(private readonly realmsService: RealmsService) {}

  // Keycloak-compatible JWKS path. pawn-backend's jwks-rsa client fetches this.
  @Public() // external services fetch public keys without a token
  @Get(':realm/protocol/openid-connect/certs')
  getCerts(@Param('realm') realm: string) {
    return this.realmsService.getJwks(realm);
  }
}
