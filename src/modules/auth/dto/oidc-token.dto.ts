import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * OAuth2 Resource Owner Password Credentials grant body, submitted as
 * application/x-www-form-urlencoded — mirrors Keycloak's token endpoint so
 * existing password-grant clients (e.g. pawn-backend) work unmodified.
 */
export class OidcTokenDto {
  @ApiProperty({ example: 'password' })
  @IsIn(['password'])
  grant_type!: string;

  @ApiProperty({ example: 'pawn-backend' })
  @IsString()
  @IsNotEmpty()
  client_id!: string;

  @ApiProperty({ required: false, description: 'Required unless the client is public' })
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
