import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty({ description: 'UUID of the client' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Client identifier' })
  @Expose()
  clientId: string;

  @ApiProperty({ description: 'Client name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Whether this is a public client (no secret)' })
  @Expose()
  publicClient: boolean;

  @ApiProperty({ description: 'Whether the client is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Redirect URIs (comma-separated)' })
  @Expose()
  redirectUris: string;

  @ApiProperty({ description: 'Allowed grant types (comma-separated)' })
  @Expose()
  grantTypes: string;

  @ApiProperty({ description: 'When the client was created' })
  @Expose()
  createdAt: Date;
}
