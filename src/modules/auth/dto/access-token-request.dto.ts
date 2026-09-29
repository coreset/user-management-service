import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

/**
 * Body for POST /realms/:realmName/protocol/openid-connect/access-token —
 * form-encoded, matching Keycloak's token endpoint. Supports two grants:
 *
 *  - `password` (default when `grant_type` is omitted, for backward
 *    compatibility with existing callers like pawn-backend, which never send
 *    `grant_type` at all): requires `username`/`password`, issues a user token.
 *  - `client_credentials`: requires only `client_id`/`client_secret` (no user
 *    in the loop) — issues a service-account token for the client itself.
 *    The client must have `client_credentials` listed in its `grantTypes`
 *    (checked in OidcTokenController) or the request is rejected.
 */
export class AccessTokenRequestDto {
  @ApiProperty({ example: 'pawn-backend' })
  @IsString()
  @IsNotEmpty()
  client_id!: string;

  @ApiProperty({
    required: false,
    description: 'Required unless the client is public',
  })
  @IsOptional()
  @IsString()
  client_secret?: string;

  @ApiProperty({
    required: false,
    example: 'password',
    enum: ['password', 'client_credentials'],
    description:
      'Defaults to "password" when omitted, for backward compatibility',
  })
  @IsOptional()
  @IsIn(['password', 'client_credentials'])
  grant_type?: 'password' | 'client_credentials';

  @ApiProperty({ example: 'jdoe', required: false })
  @ValidateIf(
    (dto: AccessTokenRequestDto) => dto.grant_type !== 'client_credentials',
  )
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({ required: false })
  @ValidateIf(
    (dto: AccessTokenRequestDto) => dto.grant_type !== 'client_credentials',
  )
  @IsString()
  @IsNotEmpty()
  password?: string;
}
