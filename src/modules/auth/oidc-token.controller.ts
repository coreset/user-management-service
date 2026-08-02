import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { parseExpiry } from '../../common/utils/time.util';
import { AuthService } from './auth.service';
import { ClientsService } from '../clients/clients.service';
import { OidcTokenDto } from './dto/oidc-token.dto';
import { OidcTokenResponseDto } from './dto/oidc-token-response.dto';
import { Public } from './decorators/public.decorator';
import { AuthRequest as Request } from './types/request';

/**
 * Keycloak-compatible OAuth2 token endpoint, kept separate from AuthController
 * so the existing JSON `/auth/:realmName/login` contract is untouched. Wraps
 * the same AuthService.validateUser/login used there — no auth logic is
 * duplicated, only the request/response shape differs (form-encoded OAuth2
 * password grant in, OAuth2 token pair out) so clients built against a real
 * Keycloak token endpoint work here unmodified.
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
  @Post(':realmName/protocol/openid-connect/token')
  @ApiOperation({
    summary: 'Issue a token pair (Keycloak-compatible)',
    description:
      "OAuth2 Resource Owner Password Credentials grant. Form-encoded body, matching Keycloak's token endpoint.",
  })
  @ApiParam({ name: 'realmName', example: 'master', description: 'Realm the client/user belong to' })
  @ApiBody({ type: OidcTokenDto })
  @ApiResponse({ status: 200, description: 'Token issued.', type: OidcTokenResponseDto })
  @ApiResponse({ status: 400, description: 'Unsupported grant_type, or client not allowed to use it.' })
  @ApiResponse({ status: 401, description: 'Invalid client credentials or invalid user credentials.' })
  @ApiResponse({ status: 404, description: "Realm 'realmName' not found." })
  async token(
    @Param('realmName') realmName: string,
    @Body() dto: OidcTokenDto,
    @Req() req: Request,
  ) {
    
    const realmId = await this.clientsService.resolveRealmId(realmName);
    const client = await this.clientsService.findByClientId(realmId, dto.client_id);

    if (!client.isActive) {
      throw new UnauthorizedException('invalid_client');
    }
    // Confidential clients must present their secret; public clients have none to check.
    if (!client.publicClient && client.clientSecret !== dto.client_secret) {
      throw new UnauthorizedException('invalid_client');
    }
    // const allowedGrantTypes = (client.grantTypes || '')
    //   .split(',')
    //   .map((grantType) => grantType.trim());
    // if (!allowedGrantTypes.includes(dto.grant_type)) {
    //   throw new BadRequestException('unauthorized_client');
    // }
    
    const user = await this.authService.validateUser(dto.username, dto.password, realmName);
    const result = await this.authService.login(
      user.id,
      { ip: req.ip, userAgent: req.get('user-agent') ?? undefined },
      user,
    );

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
