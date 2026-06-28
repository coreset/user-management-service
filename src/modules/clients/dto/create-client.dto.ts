import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ name: 'name', required: true, example: 'pawn-backend' })
  @IsString()
  name: string;

  @ApiProperty({ name: 'clientId', required: true, example: 'pawn-backend' })
  @IsString()
  clientId: string;

  @ApiProperty({
    name: 'publicClient',
    required: false,
    example: false,
    description: 'Public clients get no client_secret',
  })
  @IsOptional()
  @IsBoolean()
  publicClient?: boolean;

  @ApiProperty({
    name: 'redirectUris',
    required: false,
    example: 'http://localhost:3000/callback',
  })
  @IsOptional()
  @IsString()
  redirectUris?: string;

  @ApiProperty({
    name: 'grantTypes',
    required: false,
    example: 'password,refresh_token',
  })
  @IsOptional()
  @IsString()
  grantTypes?: string;

  @ApiProperty({ name: 'isActive', required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
