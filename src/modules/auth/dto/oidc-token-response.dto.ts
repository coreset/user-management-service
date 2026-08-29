import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/** Keycloak-shaped response for POST /realms/:realm/protocol/openid-connect/token. */
export class OidcTokenResponseDto {
  @ApiProperty({ description: 'Short-lived RS256 JWT access token' })
  @Expose()
  access_token: string;

  @ApiProperty({ example: 'Bearer' })
  @Expose()
  token_type: string;

  @ApiProperty({ description: 'Access token lifetime, in seconds' })
  @Expose()
  expires_in: number;

  @ApiProperty({ description: 'Long-lived refresh token' })
  @Expose()
  refresh_token: string;

  @ApiProperty({ description: 'Refresh token lifetime, in seconds' })
  @Expose()
  refresh_expires_in: number;
}
