import { Body, Controller, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { parseExpiry } from '../../common/utils/time.util';
import { AuthService } from './auth.service';
import { Client } from '../clients/entities/client.entity';
import { ClientsService } from '../clients/clients.service';
import { AccessTokenRequestDto } from './dto/access-token-request.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
import { OidcTokenResponseDto } from './dto/oidc-token-response.dto';
import { Public } from './decorators/public.decorator';
import { AuthRequest as Request } from './types/request';

/**
 * Keycloak-compatible OAuth2 token endpoints, kept separate from AuthController
 * so the existing JSON `/auth/:realmName/login` contract is untouched. Wraps
 * the same AuthService.validateUser/login/refreshTokenByRawToken used there —
 * no auth logic is duplicated, only the request/response shape differs
 * (form-encoded OAuth2 body in, OAuth2 token pair out) so clients built
 * against a real Keycloak token endpoint work here unmodified. Password-grant
 * and refresh-grant requests are separate routes rather than one endpoint
 * branching on `grant_type`.
 */
@ApiTags('oidc')
@Controller('realms')
export class OidcTokenController {
  constructor(
    private readonly authService: AuthService,
    private readonly clientsService: ClientsService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post(':realmName/protocol/openid-connect/access-token')
  @ApiOperation({
    summary: 'Issue a token pair from a username/password (Keycloak-compatible)',
    description:
      "OAuth2 Resource Owner Password Credentials grant. Form-encoded body, matching Keycloak's token endpoint.",
  })
  @ApiParam({ name: 'realmName', example: 'master', description: 'Realm the client/user belong to' })
  @ApiBody({ type: AccessTokenRequestDto })
  @ApiResponse({ status: 200, description: 'Token issued.', type: OidcTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid client credentials or invalid user credentials.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  async accessToken(
    @Param('realmName') realmName: string,
    @Body() dto: AccessTokenRequestDto,
    @Req() req: Request,
  ) {
    await this.validateClient(realmName, dto.client_id, dto.client_secret);

    const user = await this.authService.validateUser(dto.username, dto.password, realmName);
    const result = await this.authService.login(
      user.id,
      { ip: req.ip, userAgent: req.get('user-agent') ?? undefined },
      user,
    );

    return this.toTokenResponse(result);
  }

  @Public()
  @Post(':realmName/protocol/openid-connect/refresh-token')
  @ApiOperation({
    summary: 'Issue a token pair from a refresh token (Keycloak-compatible)',
    description:
      "OAuth2 refresh_token grant. Form-encoded body, matching Keycloak's token endpoint.",
  })
  @ApiParam({ name: 'realmName', example: 'master', description: 'Realm the client/user belong to' })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiResponse({ status: 200, description: 'Token issued.', type: OidcTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid client credentials or invalid/expired refresh token.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  async refreshToken(
    @Param('realmName') realmName: string,
    @Body() dto: RefreshTokenRequestDto,
  ) {
    await this.validateClient(realmName, dto.client_id, dto.client_secret);

    const result = await this.authService.refreshTokenByRawToken(dto.refresh_token);

    return this.toTokenResponse(result);
  }

  private async validateClient(
    realmName: string,
    clientId: string,
    clientSecret?: string,
  ): Promise<Client> {
    const realmId = await this.clientsService.resolveRealmId(realmName);
    const client = await this.clientsService.findByClientId(realmId, clientId);

    if (!client.isActive) {
      throw new UnauthorizedException('invalid_client');
    }
    // Confidential clients must present their secret; public clients have none to check.
    if (!client.publicClient && client.clientSecret !== clientSecret) {
      throw new UnauthorizedException('invalid_client');
    }
    return client;
  }

  private toTokenResponse(result: { token: string; refreshToken: string }) {
    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRE_IN', '1d');
    const refreshExpiresIn = this.configService.get<string>('REFRESH_JWT_EXPIRE_IN', '');

    return plainToInstance(
      OidcTokenResponseDto,
      {
        access_token: result.token,
        token_type: 'Bearer',
        expires_in: Math.floor(parseExpiry(accessExpiresIn) / 1000),
        refresh_token: result.refreshToken,
        refresh_expires_in: Math.floor(parseExpiry(refreshExpiresIn) / 1000),
      },
      { excludeExtraneousValues: true },
    );
  }
}
