import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Body for POST /realms/:realmName/protocol/openid-connect/refresh-token —
 * form-encoded, matching Keycloak's refresh-token-grant token request.
 */
export class RefreshTokenRequestDto {
  @ApiProperty({ example: 'pawn-backend' })
  @IsString()
  @IsNotEmpty()
  client_id!: string;

  @ApiProperty({ required: false, description: 'Required unless the client is public' })
  @IsOptional()
  @IsString()
  client_secret?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
