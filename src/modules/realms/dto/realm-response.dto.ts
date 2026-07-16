import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RealmResponseDto {
  @ApiProperty({ description: 'UUID of the realm' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Realm name (globally unique)' })
  @Expose()
  realmName: string;

  @ApiProperty({ description: 'Display name for the realm', required: false })
  @Expose()
  displayName?: string;

  @ApiProperty({ description: 'Whether the realm is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'When the realm was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'When the realm was last updated' })
  @Expose()
  updatedAt: Date;
}
