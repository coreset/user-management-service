import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: "Get a realm's public JSON Web Key Set (JWKS)",
    description:
      'Keycloak-compatible, unauthenticated endpoint. External services fetch this to verify access tokens issued for the realm.',
  })
  @ApiParam({
    name: 'realm',
    required: true,
    example: 'master',
    description: 'Name of the realm whose signing keys are requested',
  })
  @ApiResponse({ status: 200, description: 'JWKS document containing the realm\'s active public key(s).' })
  getCerts(@Param('realm') realm: string) {
    return this.realmsService.getJwks(realm);
  }
}
