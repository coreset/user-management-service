import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Body for POST /realms/:realmName/protocol/openid-connect/access-token —
 * form-encoded, matching Keycloak's password-grant token request.
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

  @ApiProperty({ example: 'jdoe' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
